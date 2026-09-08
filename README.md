# Panadería Santa Eduvigis — sitio web (estático)

Sitio ya compilado. **No necesita PHP ni ningún paso de build.**

---

## Cómo publicarlo en GitHub Pages (paso a paso)

### 1. Crea el repositorio
- GitHub → **New repository**
- Nombre: el que quieras (ej. `santa-eduvigis`)
- Visibilidad: **Public** ✅ (con cuenta gratis, Pages NO funciona en repos privados)
- Crea el repo (sin README, sin .gitignore)

### 2. Sube los archivos — TODOS A LA RAÍZ
En el repo vacío: **Add file ▸ Upload files**.

Arrastra **el contenido de esta carpeta**, es decir estos elementos:

```
index.html
productos.html
sucursales.html
nosotros.html
404.html
403.html
500.html
mantenimiento.html
.nojekyll
assets/        (la carpeta completa)
```

> ⚠️ Importante: `index.html` tiene que quedar **en la primera pantalla del
> repositorio**, NO dentro de una carpeta. Si ves algo como
> `_SUBIR-A-GITHUB/index.html` o `santaeduvigis-web/index.html`, está mal:
> borra y vuelve a subir el CONTENIDO, no la carpeta.

Luego: **Commit changes**.

### 3. Activa Pages
Repo → **Settings ▸ Pages**:
- **Source:** `Deploy from a branch`
- **Branch:** `main`
- **Folder:** `/ (root)`
- **Save**

### 4. Espera y abre
- Recarga la página de *Settings ▸ Pages* cada ~30 s.
- Cuando aparezca el recuadro verde **"Your site is live at https://…"**, haz clic ahí.
- La dirección es `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/` (con barra `/` al final).

El primer despliegue puede tardar 1–3 minutos.

---

## Si sigue saliendo 404

| Síntoma | Causa | Solución |
|---|---|---|
| 404 gris de GitHub | Pages no está sirviendo | El repo es **privado** → hazlo público. O *Source* está en "GitHub Actions" → cámbialo a "Deploy from a branch". |
| 404 gris, repo público y Pages en main/root | `index.html` quedó dentro de una subcarpeta | Sube el **contenido**, no la carpeta. |
| Carga sin estilos (todo blanco) | Falta la carpeta `assets/` | Vuelve a subir `assets/` completa. |
| Sale "Your site is live" pero da 404 | Estás entrando a `usuario.github.io` sin el nombre del repo | Usa `usuario.github.io/nombre-del-repo/`. |
| Cambió y no se ve | Caché | Espera 1–2 min y recarga con `Ctrl + F5`. |

---

## Archivos

- `index.html` … `nosotros.html` — las 4 páginas del sitio
- `404.html`, `403.html`, `500.html`, `mantenimiento.html` — páginas de error con
  la identidad de la marca (GitHub Pages usa `404.html` automáticamente)
- `assets/` — CSS, JavaScript e imágenes
- `.nojekyll` — evita que GitHub procese el sitio con Jekyll
