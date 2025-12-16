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
src/
├── auth/
├── users/
├── products/
├── cart/
├── orders/
├── prisma/
└── main.ts
```

---

## 📄 Licence