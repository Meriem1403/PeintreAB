DB_HOST=postgres
DB_PORT=5432
DB_NAME=peintreab_db
DB_USER=peintreab_user
DB_PASSWORD=peintreab_password
DB_SSL=false

JWT_SECRET=change-moi-en-production-cle-longue-aleatoire-peintreab
JWT_EXPIRES_IN=12h

# Comptes admin (créés à la migration s’ils n’existent pas)
# À changer ensuite via « Mot de passe oublié »
ADMIN_EMAIL=alexandre.bindl@gmail.com
ADMIN_PASSWORD=admin123
ADMIN_EMAIL_2=meriemzahzouh@gmail.com
ADMIN_PASSWORD_2=admin123

PORT=3000
NODE_ENV=production
FRONTEND_URL=https://www.alexandre-bindl.fr

# SMTP : laisser vide — config via Admin → E-mail (lien sécurisé)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_FROM=
EMAIL_PASSWORD=
