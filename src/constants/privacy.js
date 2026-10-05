export const PRIVACY_POLICY_VERSION = '2026-03';

export const PRIVACY_POLICY_PATH = '/confidentialite';

export const PRIVACY_POLICY_SUMMARY =
  'Vos données sont utilisées pour gérer votre inscription et, si vous l\'acceptez, vous informer des prochains événements. Vous pouvez demander leur suppression en contactant l\'artiste.';

/** Contenu affiché sur la page dédiée (résumé juridique simplifié). */
export const PRIVACY_SECTIONS = [
  {
    id: 'resume',
    title: 'En bref',
    paragraphs: [
      PRIVACY_POLICY_SUMMARY,
      'Cette page décrit comment Alexandre Bindl traite les données personnelles collectées via le site (formulaires de contact, intérêt pour une œuvre, inscriptions aux événements et billetterie).',
    ],
  },
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    paragraphs: [
      'Alexandre Bindl, artiste peintre — site alexandre-bindl.fr.',
      'Pour toute question ou demande relative à vos données, utilisez la page Contact ou l’adresse indiquée sur le site.',
    ],
  },
  {
    id: 'donnees',
    title: 'Données collectées',
    paragraphs: [
      'Selon les services utilisés, nous pouvons traiter : identité et coordonnées (nom, prénom, email, téléphone), contenu de vos messages, choix de consentement (politique de confidentialité, invitations aux événements), informations liées aux inscriptions (créneau, nombre de billets, codes d’accès / QR pour l’entrée).',
      'Les données de navigation strictement nécessaires au fonctionnement du site peuvent être générées par votre navigateur (logs techniques côté hébergeur).',
    ],
  },
  {
    id: 'finalites',
    title: 'Finalités',
    bullets: [
      'Répondre à vos demandes (contact, intérêt pour une œuvre).',
      'Gérer les inscriptions aux expositions et événements, émettre et contrôler les billets.',
      'Vous envoyer, si vous y consentez, des invitations aux prochains événements.',
      'Assurer la sécurité du site et la bonne exécution des services.',
    ],
  },
  {
    id: 'bases',
    title: 'Bases légales',
    paragraphs: [
      'Exécution de mesures précontractuelles ou du contrat (inscription, billet, réponse à une demande).',
      'Consentement (case à cocher pour la politique de confidentialité ; opt-in séparé pour le marketing événementiel).',
      'Intérêt légitime (sécurité, amélioration du service, preuve en cas de litige), dans le respect de vos droits.',
    ],
  },
  {
    id: 'duree',
    title: 'Durée de conservation',
    paragraphs: [
      'Messages de contact et demandes liées aux œuvres : le temps nécessaire au traitement de la relation, puis archivage limité ou suppression sur demande.',
      'Inscriptions et visiteurs événements : durée de l’événement et suivi administratif raisonnable ; les contacts marketing opt-in sont conservés jusqu’à retrait du consentement.',
      'Les durées exactes peuvent être précisées ultérieurement ; vous pouvez demander la suppression à tout moment (voir ci-dessous).',
    ],
  },
  {
    id: 'destinataires',
    title: 'Destinataires et hébergement',
    paragraphs: [
      'Les données sont accessibles à l’artiste et aux personnes habilitées pour l’administration du site.',
      'Des prestataires techniques (hébergement, envoi d’emails transactionnels) peuvent traiter certaines données pour notre compte, dans le cadre de contrats conformes au RGPD.',
      'Aucune revente de vos données à des tiers à des fins commerciales.',
    ],
  },
  {
    id: 'droits',
    title: 'Vos droits',
    paragraphs: [
      'Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité lorsque applicable.',
      'Pour le marketing événementiel, vous pouvez retirer votre consentement à tout moment en nous contactant.',
      'Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    paragraphs: [
      'Le site vise un usage minimal de cookies. Des cookies techniques peuvent être nécessaires à la session (ex. connexion administrateur).',
      'Une politique cookies détaillée pourra compléter cette page si des outils de mesure d’audience sont ajoutés.',
    ],
  },
  {
    id: 'mises-a-jour',
    title: 'Mise à jour',
    paragraphs: [
      `Version affichée : ${PRIVACY_POLICY_VERSION}. Cette politique pourra évoluer ; la date de version sera mise à jour en conséquence.`,
    ],
  },
];
