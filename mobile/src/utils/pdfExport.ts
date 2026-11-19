import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BRAND } from '../config/brand';

export async function exportNutritionReportPdf(params: {
  userName: string;
  period: 'Weekly' | 'Monthly';
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgWaterMl: number;
  weightChangeKg: number;
  insights: string[];
}) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 28px; color: #1b2a1e; }
          h1 { color: ${BRAND.primaryColor}; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d7e3d8; padding: 10px; text-align: left; }
          th { background: ${BRAND.primaryColor}; color: #fff; }
          .disclaimer { margin-top: 24px; font-size: 12px; color: #5c6b5e; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>${BRAND.appName} — ${params.period} Nutrition Report</h1>
        <p>User: <strong>${params.userName || 'User'}</strong> • Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <tr><th>Metric</th><th>Period Average / Change</th></tr>
          <tr><td>Average Daily Calories</td><td>${params.avgCalories} kcal</td></tr>
          <tr><td>Average Daily Protein</td><td>${params.avgProtein} g</td></tr>
          <tr><td>Average Daily Carbs</td><td>${params.avgCarbs} g</td></tr>
          <tr><td>Average Daily Fat</td><td>${params.avgFat} g</td></tr>
          <tr><td>Average Daily Water</td><td>${params.avgWaterMl} ml</td></tr>
          <tr><td>Weight Change</td><td>${params.weightChangeKg > 0 ? '+' : ''}${params.weightChangeKg} kg</td></tr>
        </table>
        <h3>Insights</h3>
        <ul>
          ${params.insights.map((i) => `<li>${i}</li>`).join('')}
        </ul>
        <p class="disclaimer">Health Disclaimer: ${BRAND.appName} provides general nutritional guidance and does not replace a doctor or dietitian.</p>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${BRAND.appName} Report` });
  }
  return uri;
}
