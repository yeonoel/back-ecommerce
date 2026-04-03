import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from 'src/common/decorators/public.decorator';
import { OrdersService } from 'src/orders/orders.service';

@Controller('webhook-whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService,
    private readonly ordersService: OrdersService
  ) { }

  // VALIDATION DU WEBHOOK (Appelé une seule fois par Meta pour vérifier ton serveur)
  @Get()
  @Public()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    // On compare le token envoyé par Meta avec celui de ton .env
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return 'Forbidden';
  }

  // RÉCEPTION DES MESSAGES (Quand le client clique sur ton bouton React)
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.type === 'text') {
      const customerPhone = message.from;
      const text = message.text.body;

      // Force le numéro au format 10 chiffres (avec le 07)
      const formattedPhone = customerPhone.startsWith('2250')
        ? customerPhone
        : customerPhone.replace('225', '22507'); // Ajuste selon ton préfixe (07, 05 ou 01)
      const orderMatch = text.match(/#(ORD-[\w-]+)/);
      const slugMatch = text.match(/\[(.*?)\]/);
      if (orderMatch) {
        const orderNumber = orderMatch[1];
        const storeSlug = slugMatch[1];
        console.log(`✅ COMMANDE DÉTECTÉE : #${orderNumber} par ${formattedPhone}`);
        const order = await this.ordersService.confirmeOrder(orderNumber, storeSlug);
        console.log(`✅ COMMANDE CONFIRMÉE : #${orderNumber} par ${formattedPhone}`);

        if (!order) {

          throw new BadRequestException('Commande introuvable');
        }
        const location = `${order.getLocation()}`;
        console.log("location", location)
        // RÉPONSE GRATUITE (car le client a écrit en premier)
        await this.whatsappService.sendOrderConfirmation(formattedPhone, orderNumber, location);
      } else {
        console.log(`⚠️ Aucun ID trouvé. Tentative d'envoi d'une réponse de test...`);
        console.error(`❌ Échec de la réponse de test`);
      }
    }
    return { status: 'received' };
  }
}
