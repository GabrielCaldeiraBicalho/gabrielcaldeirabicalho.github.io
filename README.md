# ✨ Lua Finanças — PWA de Controle Financeiro Pessoal

![Lua Finanças Banner](https://img.shields.io/badge/version-0.9.0-pink?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

> **Sua evolução financeira na palma da mão** – dashboard, metas, cartões, orçamentos, relatórios PDF e tudo offline.

![Tela principal](./screenshot.png) <!-- você pode adicionar uma captura depois -->

## 📋 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades principais](#-funcionalidades-principais)
- [Tecnologias utilizadas](#-tecnologias-utilizadas)
- [Como executar localmente](#-como-executar-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
- [Build para produção](#-build-para-produção)
- [Deploy no GitHub Pages](#-deploy-no-github-pages)
- [Instalação como PWA no celular](#-instalação-como-pwa-no-celular)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Próximos passos (roadmap)](#-próximos-passos-roadmap)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🧠 Sobre o projeto

**Lua Finanças** é uma aplicação web progressiva (PWA) que ajuda você a:

- Registrar **receitas e despesas** de forma simples
- Organizar **orçamentos mensais por categoria**
- Gerenciar **cartões de crédito** com controle de limite e faturas
- Visualizar **gráficos interativos** (evolução do saldo, despesas por categoria, fluxo de caixa)
- Gerar **extratos mensais em PDF**
- Trabalhar **offline** (dados salvos localmente)
- Instalar no **celular como um app nativo** (Android e iOS)

O projeto nasceu como um código único (`index.html` com tudo junto) e foi **modularizado** com **Vite** para facilitar manutenção e escalabilidade.

---

## 🚀 Funcionalidades principais

| Módulo | O que faz |
|--------|-----------|
| 📊 **Dashboard** | Saldo total, receitas/despesas, taxa de poupança, ranking de categorias, previsão de gastos, nota de saúde financeira |
| 💸 **Transações** | CRUD completo, parcelamento (crédito), filtros por data/categoria/busca |
| 💳 **Cartões** | Cadastro de cartões (limite, bandeira, fechamento, vencimento), acompanhamento de gastos |
| 🎯 **Orçamento mensal** | Defina metas por categoria e veja o progresso (gráfico de barras) |
| 📈 **Fluxo de caixa** | Gráfico semanal/mensal comparando receitas e despesas |
| 📑 **Faturas** | Visualização de faturas abertas/fechadas, pagamento direto pelo app |
| 🏷️ **Gerenciar categorias** | Crie, edite, delete, exporte e importe categorias (JSON) |
| 🎨 **Temas** | Modo claro/escuro + 5 cores principais (rosa, azul, verde, laranja, roxo) |
| 📄 **Exportar PDF** | Extrato mensal com todas as transações e resumo financeiro |
| 🔒 **Login local** | Credenciais fixas: `Lua` / `admin` (pode ser substituído por autenticação real) |
| 📱 **PWA** | Instalável, funciona offline, ícone na tela inicial, splash screen |

---

## 🛠️ Tecnologias utilizadas

- **HTML5 / CSS3** (variáveis CSS, Flexbox/Grid, animações)
- **JavaScript (ES Modules)** – código modularizado
- **Vite** – build tool e servidor de desenvolvimento
- **Chart.js** – gráficos interativos
- **jsPDF + html2canvas** – geração de PDF
- **Font Awesome 6** – ícones
- **Google Fonts (Quicksand)** – tipografia moderna
- **LocalStorage** – persistência de dados (offline-first)
- **Service Worker** – cache para PWA

---

