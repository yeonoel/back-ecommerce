import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  async sendOrderConfirmation(customerPhone: string, orderId: string, location: string) {
    const url = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

    try {
      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "template",
          template: {
            name: "confirmation_achat", // LE NOM EXACT du modèle sur Meta
            language: { code: "fr_CI" },   // La langue choisie (fr_CI)
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: orderId },  // Remplace {{1}} dans ton modèle
                  { type: "text", text: location }  // Remplace {{2}} dans ton modèle
                ]
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Message de confirmation envoyé !');
      return response.data;
    } catch (error) {
      console.error("❌ Erreur d'envoi dynamique :", error.response?.data || error.message);
    }
  }

}
