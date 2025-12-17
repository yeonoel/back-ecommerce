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


## 🗄️ Création de la base de données

Ce projet utilise **PostgreSQL** avec **Docker Compose** pour la gestion de la base de données.

---

### ✅ Prérequis

Avant de commencer, assurez-vous d’avoir installé :
- **Docker**
- **Node.js**
- Un client PostgreSQL (psql, DBeaver, etc.)

---

### 🚀 Démarrage de la base de données

La base de données est créée automatiquement via Docker Compose.

```bash
npm run db:start
Cette commande :

démarre le conteneur PostgreSQL

crée la base de données définie dans docker-compose.yml

📦 Migrations
Les migrations permettent de créer les tables, relations et index dans la base de données.

Générer une migration (si nécessaire)

npm run migration:generate
Exécuter les migrations

npm run migration:run
➡️ Les tables sont maintenant créées dans la base de données.

🌱 Insertion des données de test (Seed)
Le seeding permet de remplir automatiquement la base de données avec des données de test
(utilisateurs, catégories, produits, variantes, paniers, etc.).

Nettoyer la base de données

npm run seed:clean
Insérer les données de test
bash
Copy code
npm run seed
Méthode recommandée

npm run seed:force
➡️ Supprime toutes les données existantes puis réinsère des données propres.

🔍 Vérification
Accédez à la base de données avec :

DBeaver

psql

tout autre client PostgreSQL

Vérifiez que :

les tables sont bien créées

les données de test sont bien présentes

⚠️ Important
Les commandes de seed sont destinées uniquement à l’environnement de développement.
Ne pas utiliser en production.



## 📄 Licence