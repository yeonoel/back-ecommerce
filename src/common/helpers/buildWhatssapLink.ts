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