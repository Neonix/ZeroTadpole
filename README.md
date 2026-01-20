# 🐸 ZeroTadpole - Version Améliorée

Un jeu multijoueur en temps réel où vous incarnez un têtard dans un monde aquatique !

## ✨ Nouvelles Fonctionnalités

### Interface Responsive
- **Compatible tous appareils** : Windows, Android, iOS, tablettes
- **Mode plein écran** : Cliquez sur le bouton ⛶ ou utilisez F11
- **Adaptation automatique** : L'interface s'adapte à la taille de l'écran

### Contrôles Améliorés
- **Desktop** : Souris pour diriger, clic maintenu pour nager, Espace pour le boost
- **Mobile** : Joystick virtuel à gauche, bouton boost à droite
- **Chat** : Touche T ou Entrée pour ouvrir le chat

### Gameplay
- **PNJ Ovule** : Un guide qui vous accueille et vous donne des conseils
- **Système de quêtes** : Collectez des orbes pour gagner des gemmes
- **Boost** : Utilisez la barre d'espace pour une accélération temporaire
- **Bonus communs** : Des orbes spéciaux qui réapparaissent régulièrement
- **Progression** : Débloquez de nouvelles couleurs en complétant des quêtes

### Design Moderne
- **HUD épuré** : Score, gemmes, joueurs connectés en un coup d'œil
- **Animations fluides** : Effets visuels agréables
- **Thème aquatique** : Interface sombre avec des accents lumineux
- **Toasts** : Notifications non-intrusives

## 🚀 Installation

### Prérequis
- PHP 7.4+ avec support CLI
- Extension PHP pcntl (Linux/Mac) ou Windows avec PHP
- Port 8282 disponible

### Lancement

1. **Démarrer le serveur WebSocket** :
```bash
cd ZeroTadpole
php start.php start
```

2. **Accéder au jeu** :
Ouvrez `http://localhost:8282` dans votre navigateur

### En production

Pour un environnement de production :
```bash
php start.php start -d  # Mode daemon
```

## 🎮 Comment Jouer

1. **Choisissez un nom** : Lors de votre première visite, Ovule vous demandera votre nom
2. **Dirigez votre têtard** : Utilisez la souris ou le joystick tactile
3. **Nagez** : Maintenez le clic ou appuyez sur l'écran
4. **Utilisez le boost** : Espace ou bouton ⚡ sur mobile
5. **Collectez les orbes** : Les orbes lumineux vous donnent des points
6. **Terminez les quêtes** : Atteignez l'objectif pour gagner des gemmes
7. **Débloquez des couleurs** : Chaque quête terminée débloque une nouvelle couleur

## 📁 Structure du Projet

```
ZeroTadpole/
├── Web/
│   ├── index.html      # Nouvelle interface
│   ├── css/
│   │   └── game.css    # Styles modernes
│   └── js/
│       ├── game.js     # Logique UI améliorée
│       ├── App.js      # Application principale (modifié)
│       └── ...
├── Server/
│   ├── WorldServer.php # Serveur de jeu
│   └── ...
└── start.php           # Point d'entrée
```

## 🔧 Configuration

### Changer le port
Modifiez `config.json` :
```json
{
    "web_port": 8282,
    "ws_port": 8282
}
```

### Serveur WebSocket personnalisé
Ajoutez `?ws=wss://monserveur.com:8282` à l'URL

## 🤝 Fonctionnalités Multijoueur

- **Chat global** : Communiquez avec tous les joueurs
- **Messages privés** : Cliquez sur un joueur dans la liste
- **Liste des joueurs** : Voyez qui est connecté
- **Temps réel** : Tous les mouvements sont synchronisés

## 📱 Compatibilité

| Plateforme | Status |
|------------|--------|
| Chrome | ✅ Supporté |
| Firefox | ✅ Supporté |
| Safari | ✅ Supporté |
| Edge | ✅ Supporté |
| Android Chrome | ✅ Supporté |
| iOS Safari | ✅ Supporté |

## 🐛 Problèmes Connus

- Le joystick virtuel n'apparaît que sur les appareils tactiles
- La reconnexion automatique peut prendre quelques secondes

## 📄 Licence

Ce projet est basé sur Workerman Tadpole et est distribué sous licence MIT.

---

Fait avec ❤️ pour une expérience de jeu fluide et agréable !
