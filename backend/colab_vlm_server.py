"""
Optional helper for running Qwen3-VL-8B on Google Colab (T4 GPU) and exposing
POST /api/identify-food so your local Windows InformedDiet backend can call it
by setting VLM_MODE=remote_http and VLM_REMOTE_URL=https://<your-tunnel-url>/api/identify-food.
"""
import io
import json
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import torch
from unsloth import FastVisionModel

from app.services.vlm_service import ANTI_LOOP_PROMPT, parse_json

app = FastAPI(title="InformedDiet Colab Qwen3-VL GPU Server")

model, tokenizer = FastVisionModel.from_pretrained(
    "unsloth/Qwen3-VL-8B-Instruct-unsloth-bnb-4bit",
    load_in_4bit=True,
    use_gradient_checkpointing="unsloth",
)
FastVisionModel.for_inference(model)


@app.post("/api/identify-food")
async def identify_food(photo: UploadFile = File(...)):
    img_bytes = await photo.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img.thumbnail((768, 768))
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": img},
                {"type": "text", "text": ANTI_LOOP_PROMPT},
            ],
        }
    ]
    try:
        inputs = tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True, return_dict=True, return_tensors="pt"
        ).to("cuda")
    except Exception:
        prompt_text = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
        inputs = tokenizer(img, prompt_text, add_special_tokens=False, return_tensors="pt").to("cuda")

    with torch.no_grad():
        out_ids = model.generate(
            **inputs,
            max_new_tokens=900,
            repetition_penalty=1.15,
            use_cache=True,
            temperature=0.1,
            min_p=0.1,
            do_sample=True,
        )
    prompt_len = inputs["input_ids"].shape[1]
    raw_out = tokenizer.decode(out_ids[0][prompt_len:], skip_special_tokens=True).strip()
    parsed, _ = parse_json(raw_out)
    return parsed
