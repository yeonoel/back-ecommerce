import { Order } from "src/orders/entities/order.entity";
import { Store } from "src/stores/entities/store.entity";

/**
 * Génère le lien WhatsApp avec le message pré-rempli
 * @param {string} phoneNumber - Le numéro de téléphone international de la boutique
 * @param {string} vendorName - Le nom du vendeur
 * @param {string} storeName - Le nom de la boutique
 * @param {string} inviteCode - Le code d'invitation unique
 * @param {string} tempPasswordPlain - Le mot de passe temporaire
 * @param {Date} expiresAt - La date d'expiration du code d'invitation
 * @returns {string} - Le lien WhatsApp généré
 */
export function BuildWhatsappLink(
    phoneNumber: string,
    vendorName: string,
    storeName: string,
    inviteCode: string,
    tempPasswordPlain: string,
    expiresAt: Date,
): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const greeting = vendorName ? `Bonjour *${vendorName}*,` : 'Bonjour,';

    const message = [
        `${greeting}`,
        ``,
        `Votre boutique *${storeName}* est prête ! 🎉`,
        ``,
        `Voici vos identifiants pour vous connecter :`,
        `🔑 Code d'invitation : *${inviteCode}*`,
        `🔒 Mot de passe temporaire : *${tempPasswordPlain}*`,
        ``,
        `Connectez-vous ici :`,
        `👉 https://votresite.com/onboarding`,
        ``,
        `⚠️ Ce code expire le ${expiresAt.toLocaleDateString('fr-FR')}.`,
    ].join('\n');

    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
    // Nettoyer le numéro (enlever espaces, +, 00)
    const cleaned = phoneNumber.replace(/[\s+\-()]/g, '').replace(/^00/, '');
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

// Après createOrder → Client envoie message au vendeur
export function getWhatsAppRedirectUrl(order: Order, store: Store): string {
    const itemsSummary = order.items
        .map(i => `  • ${i.productName}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity} — ${i.unitPrice.toLocaleString()} FCFA`)
        .join('\n');

    const message =
        `Bonjour ! 👋\n\n` +
        `Je viens de commander sur *${store.name}*\n\n` +
        `📦 *${order.orderNumber}*\n` +
        `${itemsSummary}\n\n` +
        `💰 *Total : ${order.total.toLocaleString()} FCFA*\n` +
        `📍 Ville : ${order.shippingAddressSnapshot?.city}\n\n` +
        `Merci de confirmer ma commande 🙏`;

    return this.buildWhatsAppUrl(store.whatsappNumber, message);
}

// Après approbation vendeur → Vendeur envoie message au client
export function notifyClientByWhatsApp(order: Order, store: Store, clientPhone: string): string {
    const message =
        `Bonjour ! ✅\n\n` +
        `Votre commande *${order.orderNumber}* sur *${store.name}* est confirmée !\n\n` +
        `🚚 Notre livreur vous contactera bientôt.\n` +
        `❓ Des questions ? Écrivez-nous directement.\n\n` +
        `Merci de votre confiance 🙏`;

    return this.buildWhatsAppUrl(clientPhone, message);
}

export function notifySellerNewOrder(order: Order, store: Store): string {
    const itemsSummary = order.items
        .map(i => `• ${i.productName} x${i.quantity}`)
        .join('\n');

    const message =
        `🛍️ *NOUVELLE COMMANDE !*\n\n` +
        `Client : ${order.user?.firstName} ${order.user?.lastName}\n` +
        `📦 ${order.orderNumber}\n\n` +
        `${itemsSummary}\n\n` +
        `💰 *${order.total.toLocaleString()} FCFA*\n` +
        `📍 ${order.shippingAddressSnapshot?.city}\n\n` +
        `👉 Confirmez vite sur votre dashboard !`;

    return this.buildWhatsAppUrl(store.whatsappNumber, message);
}


export function createSharingLinkOnSocialMedia(prductSlug: string, slugStore: string): Record<string, string> {
    const productUrl = `${process.env.FRONTEND_URL}/${slugStore}/products/${prductSlug}`;
    const shareLinks = {
        // Lien direct du produit
        productUrl,
        // Partage Facebook
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
        // Partage TikTok Bio (TikTok n'a pas de share URL directe)
        tiktok: productUrl,
    };
    return shareLinks;
}