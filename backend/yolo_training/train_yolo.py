"""
Section 5.2: Ultralytics YOLO Fine-Tuning & ONNX Export Script for InformedDiet.
Usage:
  pip install ultralytics
  python yolo_training/train_yolo.py --data food_dataset.yaml --model yolo11n.pt --version v1
"""
import argparse


def main():
    parser = argparse.ArgumentParser(description="Train and export InformedDiet YOLO food detector")
    parser.add_argument("--data", required=True, help="Path to YOLO dataset YAML (Indian + Global food classes)")
    parser.add_argument("--model", default="yolo11n.pt", help="Base Ultralytics pretrained weights")
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--version", default="v1")
    args = parser.parse_args()

    from ultralytics import YOLO

    model = YOLO(args.model)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        project="runs/informeddiet",
        name=f"food_detector_{args.version}",
    )
    metrics = model.val()
    print(f"Validation mAP@0.5: {metrics.box.map50:.4f} (Target >= 0.80)")

    exported = model.export(format="onnx", dynamic=True)
    print(f"Exported ONNX model to: {exported}")


if __name__ == "__main__":
    main()
