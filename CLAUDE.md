# RaidOps — Contexte projet pour Claude Code

## Vue d'ensemble

Application web de gestion de guildes World of Warcraft.
Auth via Discord OAuth2, gestion de raids, roster, loot, calendrier.

---

## Stack technique

### Back-end

- **Runtime** : .NET 9, C#
- **Architecture** : Clean Architecture + CQRS (maison, sans MediatR)
- **Base de données** : PostgreSQL + Entity Framework Core
- **Bot Discord** : Netcord
- **Auth** : Discord OAuth2 + JWT (cookie `access_token`)

### Front-end

- **Framework** : Angular 21 (migration v22 quand stable)
- **UI** : Angular Material (thème dark custom, palette or/lime `#ffb74d`)
- **Style** : SCSS + CSS custom properties
- **Composants** : Standalone components
- **État** : Services + Signals (pas de NgRx)
- **Font** : Inter

---

## Structure solution back-end (.NET)

```
RaidOps.sln
├── RaidOps.API                               # Entry point, controllers, Program.cs
├── RaidOps.Application.Contracts             # ICommand, IQuery, ICommandHandler, IQueryHandler, Result<T>
├── RaidOps.Application.Implementations      # CommandDispatcher, QueryDispatcher, handlers
├── RaidOps.Domain                            # Entités, AggregateRoot, DomainEvent
├── RaidOps.ExternalApplication.Contracts    # Interfaces Discord bot/API
├── RaidOps.ExternalApplication.Implementations  # DiscordService, bot Netcord
├── RaidOps.Infrastructure.Persistence.Contracts  # IRepository, IUnitOfWork, ITransaction
├── RaidOps.Infrastructure.Persistence.Implementations  # EF DbContext, repositories
└── RaidOps.Registry                          # DI registration (Scrutor scan)
```

---

## Patterns back-end

### CQRS

```csharp
// Commande
public class RegisterGuildCommand : ICommand
{
    public required string GuildId { get; set; }
}

// Handler
public class RegisterGuildCommandHandler(
    IGuildsRepository guildsRepository)
    : ICommandHandlerAsync<RegisterGuildCommand>
{
    public async Task<Result<CommandResponse>> HandleAsync(
        RegisterGuildCommand command,
        CancellationToken cancellationToken = default) { ... }
}

// Dispatch depuis un controller
var result = await CommandDispatcher.DispatchAsync(command, cancellationToken);
return ToActionResult(result);
```

### Result<T>

```csharp
Result<T>.Ok(value)           // succès
Result<T>.Fail("error msg")   // échec
result.Map(v => transform(v)) // transformation
result.IsSuccess / result.IsFailed
result.Value / result.Error / result.Detail
```

### Controller base

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class ApiControllerBase(
    ICommandDispatcher commandDispatcher,
    IQueryDispatcher queryDispatcher) : ControllerBase
{
    protected readonly ICommandDispatcher CommandDispatcher = commandDispatcher;
    protected readonly IQueryDispatcher QueryDispatcher = queryDispatcher;

    protected IActionResult ToActionResult<T>(Result<T> result) => result.IsSuccess
        ? Ok(result.Value)
        : BadRequest(new { error = result.Error, detail = result.Detail });
}
```

### Versioning API

```csharp
[ApiVersion("1.0")]
public class GuildsController(...) : ApiControllerBase(...) { }
```

Routes : `/api/v1/[controller]`

---

## Modèle de domaine

### Entités principales

```
DiscordAccount
  └── 1..N Character (via extension WoW : nom, realm, class, role, ilvl, spec)

Guild
  └── discord_server_id, name, realm, faction

GuildMembership  (pivot Character ↔ Guild)
  └── status : pending | active | suspended | left
  └── guild_role : member | officer | gm
  └── declared_by_player (bool)
  └── overridden_by_officer (bool)
```

### Système de permissions

- Les **permissions** sont un enum hardcodé dans le code :
  `ManageGuild | ManageRoster | ManageLoot | CreateRaidEvent | ViewOnly`
- Les **rôles** viennent de Discord (dynamiques, propres à chaque serveur)
- Le **RoleMapping** est une table par guilde : `discord_role_id → List<GuildPermission>`
- Un membre peut avoir plusieurs rôles Discord → ses permissions = **union** de tous ses rôles mappés
- Les rôles Discord sont re-fetchés à chaque connexion (pas de cache long terme)

---

## Structure front-end Angular

```
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── models/
├── features/
│   ├── guilds/
│   ├── guild-settings/
│   ├── landing-page/
│   └── user/
└── shared/
    ├── components/
    ├── directives/
    └── layout/
        └── header/
```

### Conventions Angular

- **Standalone components** partout (`standalone: true`)
- **Nommage fichiers** : `user.component.ts`, `auth.service.ts` (suffixes explicites)
- **État** : Signals + Services (pas de NgRx)
- **Génération** : `ng generate component features/guilds/components/guild-list`

### Thème Material (styles.scss)

```scss
// Palette dark/gaming — or primary (#ffb74d), lime tertiary
// CSS custom properties disponibles globalement :
--color-bg-primary: #0f1117 --color-bg-secondary: #16181f --color-bg-tertiary: #1e2028
  --color-bg-elevated: #252830 --color-border: #2e3040 --color-border-subtle: #1e2028
  --color-text-primary: #e2e2e5 --color-text-secondary: #9b9baf --color-text-muted: #5c5c6e
  --color-accent: #7c6af7 --color-accent-hover: #9585f9 --sidebar-width: 240px --navbar-height: 56px;
```

---

## Navigation / Routing (à implémenter)

```
/                     → redirect vers /guilds
/login                → page login Discord
/guilds               → sélecteur de guilde (auth required)
/guilds/:id           → layout guilde avec sidebar
  /guilds/:id/dashboard
  /guilds/:id/calendar
  /guilds/:id/roster
  /guilds/:id/settings
/no-guild             → aucun serveur éligible
/register/:id         → onboarding guilde
```

**Guards à créer :**

- `auth.guard` — utilisateur connecté, sinon `/login`
- `guild-access.guard` — accès à la guilde demandée

---

## Layout prévu

```
┌─────────────────────────────────────────────┐
│ Navbar (56px) — Logo | Sélecteur | Profil   │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Sidebar     │   Zone principale            │
│  (240px)     │                              │
│              │                              │
│  Calendrier  │                              │
│  Roster      │                              │
│  Loot        │                              │
│  ──────────  │                              │
│  [Officers]  │                              │
│  Config      │                              │
│  ──────────  │                              │
│  ⇄ Changer  │                              │
└──────────────┴──────────────────────────────┘
```

---

## Décisions techniques actées

- Pas de MediatR — dispatchers maison pour garder le contrôle
- Pas de NgRx — signals + services suffisent pour ce type d'app
- Pas de SSR/SSG — app derrière auth, SEO inutile
- Versioning API dès le départ (`Asp.Versioning.Mvc` v8)
- `Assembly.Load` remplacé par `typeof(X).Assembly` dans le Registry pour éviter les erreurs au démarrage
- Swagger généré dynamiquement via `ConfigureSwaggerOptions` + `IApiVersionDescriptionProvider`
- Repartir de zéro back + front (ancien projet conservé en référence pour récupérer des bouts)

---

## Conventions PR / commit

- **Ne jamais tronquer le titre d'une PR à 70 caractères dans ce repo.** Le squash-merge GitHub
  utilise le titre de la PR comme sujet du commit final sur `dev`, et release-please génère le
  changelog directement depuis ce message de commit. Un titre tronqué (ex: `...make …`) finit
  tel quel, ellipsis inclus, dans le CHANGELOG public livré aux utilisateurs. Toujours écrire le
  titre complet, même long.

---

## Prochaines étapes

1. **Header component** — Logo + nom app (en cours)
2. **Routing de base** + guards
3. **Auth Discord** — flux OAuth2 end-to-end
4. **Guild domain** — RegisterGuildCommand propre
5. **Characters + GuildMembership**
6. **Permissions + RoleMapping**
7. **Modules métier** — calendrier, roster, loot
