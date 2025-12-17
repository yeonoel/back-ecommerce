# E-commerce Backend (Draft)
![workflow](./screenshots/e-commerce-workflow.png)


## 📌 Description

Backend d’un site e-commerce en cours de développement.
Ce projet fournit une API REST pour la gestion des utilisateurs, produits, panier et commandes etc...

⚠️ **Note** : Ceci est un README provisoire. Une version complète sera ajoutée à la fin du projet.

---

## 🛠️ Stack technique

* **Langage** : TypeScript
* **Framework** : NestJS
* **Base de données** : PostgreSQL
* **ORM** : TYPEORM
* **Architecture** : Modulaire (NestJS)

---

## 📦 Fonctionnalités principales (en cours)

* Authentification (JWT)
* Gestion des utilisateurs
* Gestion des produits
* Panier (cart)
* Commandes

---

## 🚀 Installation

```bash
# Installation des dépendances
npm install

# Lancer le projet en mode développement
npm run start:dev
```

---

## ⚙️ Configuration

Créer un fichier `.env` à la racine du projet :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=your_secret_key
```

---

## 📂 Structure du projet (simplifiée)

```bash
backend/
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ app.controller.ts
│  ├─ app.service.ts
│  │
│  ├─ database/
│  │  ├─ data-source.ts
│  │  ├─ migrations/
│  │  │  └─ *.ts
│  │  └─ seeds/
│  │     ├─ seed.ts
|  |     ├─ clean.ts
│  │     ├─ user.seed.ts
│  │     ├─ category.seed.ts
│  │     ├─ product.seed.ts
│  │     ├─ variant.seed.ts
│  │     └─ cart.seed.ts
│  │
│  ├─ users/
│  │  ├─ users.module.ts
│  │  ├─ users.controller.ts
│  │  ├─ users.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-user.dto.ts
│  │  │  └─ update-user.dto.ts
│  │  └─ entities/
│  │     └─ user.entity.ts
│  │
│  ├─ categories/
│  │  ├─ categories.module.ts
│  │  ├─ categories.controller.ts
│  │  ├─ categories.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-category.dto.ts
│  │  │  └─ update-category.dto.ts
│  │  └─ entities/
│  │     └─ category.entity.ts
│  │
│  ├─ products/
│  │  ├─ products.module.ts
│  │  ├─ products.controller.ts
│  │  ├─ products.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-product.dto.ts
│  │  │  └─ update-product.dto.ts
│  │  └─ entities/
│  │     ├─ product.entity.ts
│  │     ├─ product-image.entity.ts
│  │     └─ product-variant.entity.ts
│  │
│  ├─ product-variants/
│  │  ├─ product-variants.module.ts
│  │  ├─ product-variants.controller.ts
│  │  ├─ product-variants.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-variant.dto.ts
│  │  │  └─ update-variant.dto.ts
│  │  └─ entities/
│  │     └─ product-variant.entity.ts
│  │
│  ├─ products-images/
│  │  ├─ products-images.module.ts
│  │  ├─ products-images.controller.ts
│  │  ├─ products-images.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-image.dto.ts
│  │  │  └─ update-image.dto.ts
│  │  └─ entities/
│  │     └─ product-image.entity.ts
│  │
│  ├─ carts/
│  │  ├─ carts.module.ts
│  │  ├─ carts.controller.ts
│  │  ├─ carts.service.ts
│  │  ├─ dto/
│  │  │  ├─ add-to-cart.dto.ts
│  │  │  └─ update-cart-item.dto.ts
│  │  └─ entities/
│  │     ├─ cart.entity.ts
│  │     └─ cart-item.entity.ts
│  │
│  ├─ orders/
│  │  ├─ orders.module.ts
│  │  ├─ orders.controller.ts
│  │  ├─ orders.service.ts
│  │  ├─ dto/
│  │  │  ├─ create-order.dto.ts
│  │  │  └─ update-order-status.dto.ts
│  │  └─ entities/
│  │     ├─ order.entity.ts
│  │     └─ order-item.entity.ts
│  │
│  ├─ auth/
│  │  ├─ auth.module.ts
│  │  ├─ auth.controller.ts
│  │  ├─ auth.service.ts
│  │  ├─ strategies/
│  │  │  └─ jwt.strategy.ts
│  │  ├─ guards/
│  │  │  └─ jwt-auth.guard.ts
│  │  └─ dto/
│  │     ├─ login.dto.ts
│  │     └─ register.dto.ts
│  │
│  ├─ payments/
│  │  ├─ payments.module.ts
│  │  ├─ payments.service.ts
│  │  └─ entities/
│  │     └─ payment.entity.ts
│  │
│  ├─ shipments/
│  │  ├─ shipments.module.ts
│  │  ├─ shipments.service.ts
│  │  └─ entities/
│  │     └─ shipment.entity.ts
│  │
│  ├─ coupons/
│  │  ├─ coupons.module.ts
│  │  ├─ coupons.service.ts
│  │  └─ entities/
│  │     ├─ coupon.entity.ts
│  │     └─ coupon-usage.entity.ts
│  │
│  ├─ wishlists/
│  │  ├─ wishlists.module.ts
│  │  ├─ wishlists.service.ts
│  │  └─ entities/
│  │     └─ wishlist.entity.ts
│  │
│  └─ notifications/
│     ├─ notifications.module.ts
│     ├─ notifications.service.ts
│     └─ entities/
│        └─ notification.entity.ts
│
├─ test/
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
│
├─ docker-compose.yml
├─ Dockerfile
├─ package.json
├─ tsconfig.json
├─ tsconfig.build.json
└─ README.md
```

---


# Base de Données - Guide Étape par Étape


## 🚀 Premier démarrage
Étape 1 : Créer la base de données avec Docker
bash
# 1.1 Démarrer PostgreSQL dans un conteneur Docker
docker-compose up -d

# 1.2 Vérifier que le conteneur tourne
docker ps
# Vous devriez voir : ecommerce-db (port 5432)


# 2.2 Vérifier les variables dans .env
# Database Configuration
BD_HOST=localhost
BD_PORT=5432
BD_USER=postgres
BD_PASSWORD=your_password_here
BD_NAME=db_ecommerce

Étape 3 : Installer les dépendances
bash

# 3.1 Installer Node.js et NPM si ce n'est pas fait
node --version  # Vérifier que Node.js est installé (>=16)
npm --version   # Vérifier NPM

# 3.2 Installer les packages
npm install
🔄 Gestion des migrations
Étape 4 : Créer les tables (Première exécution)
bash

# 4.1 Générer les migrations depuis vos entités
npm run migration:generate -- src/database/migrations/InitialSetup

# 4.2 Appliquer les migrations à la base
npm run migration:run

# 4.3 Vérifier les tables créées
docker exec -it ecommerce-db psql -U postgres -d ecommerce_db -c "\dt"
Étape 5 : Après modification des entités
bash
# 5.1 Modifier vos fichiers .entity.ts
# (ex: ajouter une colonne à Product)

# 5.2 Générer une nouvelle migration
npm run migration:generate -- src/database/migrations/AddProductColumn

# 5.3 Exécuter la nouvelle migration
npm run migration:run

# 5.4 Vérifier les modifications
docker exec -it ecommerce-db psql -U postgres -d ecommerce_db -c "\d products"
🌱 Peuplement des données
Étape 6 : Ajouter des données de test
bash
# 6.1 Peupler la base avec toutes les données
npm run seed

# 6.2 Vérifier les données insérées
docker exec -it ecommerce-db psql -U postgres -d ecommerce_db -c "SELECT email, role FROM users;"
docker exec -it ecommerce-db psql -U postgres -d ecommerce_db -c "SELECT name, price FROM products;"
Étape 7 : Ajouter manuellement une catégorie
bash

# 8.1 Nettoyer toutes les données mais garder les tables
npm run seed:clean

# 8.2 Vérifier que les tables sont vides
docker exec -it ecommerce-db psql -U postgres -d ecommerce_db -c "SELECT COUNT(*) FROM users;"
Étape 9 : Supprimer et recréer complètement
bash

# 9.1 Arrêter le conteneur
docker-compose down

# 9.2 Supprimer le volume (ATTENTION : données perdues !)
docker-compose down -v

# 9.3 Redémarrer proprement
docker-compose up -d
npm run migration:run
npm run seed
🔧 Commandes rapides pour le développement
Commande | Description
--- | ---
npm run dev | Lancer l'application en développement
npm run migration:run | Appliquer les migrations
npm run seed | Ajouter les données de test
npm run seed:force | Nettoyer et repeupler
docker-compose logs -f | Voir les logs de la base

Exemple de workflow quotidien :
bash

# 1. Démarrer les services
docker-compose up -d

# 2. Appliquer les migrations
npm run migration:run

# 3. Lancer l'application
npm run dev

# 4. Modifier une entité, puis :
npm run migration:generate -- src/database/migrations/MaModif
npm run migration:run
npm run seed


## 📄 Licence