# Deploys en Render — FinNova Academy

> Las KEYS de los hooks son secretos: viven SOLO en el dashboard de Render
> (Settings > Deploy Hook de cada servicio). Este archivo NO las contiene.
> No commitear keys jamás (ver security review 2026-09-11).

## Servicios y repos (cada push va a SU repo, sin cruces)

| Servicio | Render ID | Repo | Qué despliega |
|---|---|---|---|
| Back | `srv-d8qg5fm8bjmc738mpqp0` | `Finnova-back` (`backend/` submódulo) | API Express |
| Front | `srv-d8qg829194ac73dom990` | `AuraFi-Academy` (root; `backend` solo como puntero gitlink, `staff/` ignorado) | alumnos |
| Staff | `srv-d8qg8qm8bjmc738mt4f0` | `AuraFi-Staff` (repo anidado, NO trackeado en root) | staff |

Nota: los commits "puntero backend" en el front son solo el gitlink del
submódulo (un hash), nunca código del back. El front NO contiene código de
back ni de staff.

## Hook de deploy (redactado)

```text
POST https://api.render.com/deploy/<SERVICE_ID>?key=<VER-EN-DASHBOARD>
```

Respuesta esperada: `Accepted` + `{"deploy": {"id": "dep-..."}}`.
El build tarda 5-15 min (cola del plan gratuito). Verificar después:

- Back: `GET https://finnova-back.onrender.com/api/health` → `{"status":"ok"}`
  y campo `build` == hash mergeado (si sigue el viejo, el deploy aún no sale).
- Front/Staff: `GET https://finnova-academy.onrender.com/` (título) y
  `https://finnova-staff.onrender.com/`.

## Orden de deploy tras merges

1. Mergear backend → push `Finnova-back` → hook Back.
2. Actualizar puntero en root → push `AuraFi-Academy` → hook Front.
3. Push `AuraFi-Staff` → hook Staff (independiente, puede ir en paralelo).
4. QA en prod contra `/api/health` + flujos punta a punta.

## Troubleshooting

- `Accepted` pero build viejo tras 15 min: ver Events en dashboard (cola,
  fallo de build, o hook apuntando a otra rama).
- 503 intermitente con build sano: cold start del plan gratuito (la instancia
  duerme); reintentar, no redeployar.
