# 📦 cerebro-modeler

[![npm version](https://badge.fury.io/js/cerebro-modeler.svg)](https://badge.fury.io/js/cerebro-modeler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![written in TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

<p align="center">
  <img src="https://raw.githubusercontent.com/CarlosFerOrduna/cerebro-modeler/refs/heads/main/cerebro-modeler-cover.jpg" alt="cerebro-modeler" width="600" />
</p>

> Database-first entity generator for TypeORM with full control over formatting, imports, and schema introspection.  
> Built for MSSQL, designed for power users.

---

## 🧭 Table of Contents

- [✨ Features](#-features)
- [📦 Installation (optional)](#-installation-optional)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Usage](#️-usage)
- [🔧 Optional Flags](#-optional-flags)
- [🔤 Naming Strategy](#-naming-strategy)
- [✍️ Inline Mode](#️-inline-mode)
- [🧪 Advanced Usage](#-advanced-usage)
- [🛠 Troubleshooting](#-troubleshooting)
- [📁 Output Example](#-output-example)
- [🧠 Credits](#-credits)

---

## ✨ Features

- 🔍 Introspects SQL Server schemas
- 🧠 Generates strongly-typed TypeORM entities
- 🪶 Auto-formatted using Prettier
- 🔁 Supports `ManyToOne`, `OneToMany`, and bridge tables
- 🧩 Highly customizable naming strategy
- ⚡️ CLI-ready via `npx cerebro-modeler`

---

## 📦 Installation (optional)

You can run it via `npx` without installing, but if you prefer global usage:

```bash
yarn global add cerebro-modeler
# or
npm install -g cerebro-modeler
```

---

## 🚀 Quick Start

```bash
npx cerebro-modeler --help
```

---

## 🛠️ Usage

```bash
npx cerebro-modeler \
  --host localhost \
  --port 1433 \
  --user sa \
  --password MySecret123 \
  --database MyDB \
  --schema dbo \
  --output ./src/entities
```

If the `--tables` flag is not provided, the CLI will prompt you interactively:

- First, it asks whether you want to generate models for **all tables** in the schema.
- If you decline, it will ask you to **manually enter** a comma-separated list of table names.
- This makes it easy to control which entities are generated without needing to specify `--tables` up front.

### Required Flags

| Flag         | Alias | Description         |
| ------------ | ----- | ------------------- |
| `--host`     | `-h`  | SQL Server hostname |
| `--port`     | `-p`  | SQL Server port     |
| `--user`     | `-u`  | DB user             |
| `--password` | `-x`  | DB password         |
| `--database` | `-d`  | Database name       |
| `--schema`   | `-s`  | Schema (e.g. `dbo`) |
| `--output`   | `-o`  | Output directory    |

---

## 🔧 Optional Flags

| Flag               | Alias  | Description                                                                           |
| ------------------ | ------ | ------------------------------------------------------------------------------------- |
| `--engine`         | `-e`   | Database engine (currently only `mssql` is supported)                                 |
| `--tables`         | `-t`   | Comma-separated list of tables to introspect (e.g., `users,orders`)                   |
| `--ssl`            |        | Use SSL connection to the database                                                    |
| `--writeMode`      | `-w`   | Writing strategy: `inline` replaces existing files, `out` saves to separate directory |
| `--caseFile`       | `--cf` | Naming style for file names: `pascal`, `camel`, `snake`, `kebab`                      |
| `--caseClass`      | `--cc` | Naming style for class names inside files: `pascal`, `camel`, `snake`                 |
| `--caseProperty`   | `--cp` | Naming style for field names: `camel`, `pascal`, `snake`                              |
| `--prefixFile`     | `--pf` | Add prefix to file names (e.g., `"I"` → `IUser.ts`)                                   |
| `--prefixClass`    | `--pc` | Add prefix to class names (e.g., `"I"` → `IUser`)                                     |
| `--prefixProperty` | `--pp` | Add prefix to property names (e.g., `"_"` → `_createdAt`)                             |
| `--suffixFile`     | `--sf` | Add suffix to file names (e.g., `"Model"` → `UserModel.ts`)                           |
| `--suffixClass`    | `--sc` | Add suffix to class names (e.g., `"Model"` → `UserModel`)                             |
| `--suffixProperty` | `--sp` | Add suffix to property names (e.g., `"_"` → `createdAt_`)                             |
| `--fileExtension`  | `--fe` | Add a suffix to file names before `.ts` (e.g., `"entity"` → `user.entity.ts`)         |

---

## 🔤 Naming Strategy

You can customize how files, classes, and properties are named using:

- `--caseFile`, `--prefixFile`, `--suffixFile`, `--fileExtension`
- `--caseClass`, `--prefixClass`, `--suffixClass`
- `--caseProperty`, `--prefixProperty`, `--suffixProperty`

### File Naming Behavior

The final file name is composed like this:

```
[prefix][BaseName][suffix][.fileExtension].ts
```

**Example:**

```bash
--caseFile kebab --prefixFile i --suffixFile model --fileExtension entity
# → i-user-model.entity.ts
```

> The `--fileExtension` does not affect the class name. It is appended before `.ts` and treated as a true extension, not as a suffix for casing.

---

## ✍️ Inline Mode

Use `--write-mode inline` to overwrite entities directly in your existing project.  
Useful for regenerating up-to-date models without touching unrelated files.

---

## 🧪 Advanced Usage

Generate models with snake_case files and camelCase properties:

```bash
npx cerebro-modeler \
  --host localhost \
  --user sa \
  --password MySecret123 \
  --database MyDB \
  --tables users,orders \
  --caseFile snake \
  --caseProperty camel \
  --fileExtension entity \
  --output ./src/models
```

---

## 🛠 Troubleshooting

- **Missing required flag**: If you forget to pass a required flag (like `--host`), the CLI will prompt you interactively.
- **Tables not generating**: Ensure your DB user has permission to read `INFORMATION_SCHEMA` views.
- **Output is empty**: Make sure the specified schema and table names are correct.

---

## 📁 Output Example

```ts
@Entity('player', { schema: 'dbo' })
export class PlayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @OneToMany(() => TournamentEntity, t => t.player)
  tournaments: TournamentEntity[];
}
```

## 🧠 Credits

Based on [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator) but rebuilt from scratch for full control and extensibility.
