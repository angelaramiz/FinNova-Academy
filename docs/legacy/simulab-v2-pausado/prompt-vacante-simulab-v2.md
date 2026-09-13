# Prompt para generar el formato SIMULAB v2 desde una vacante (screenshot)

**Uso**: pega este prompt en ChatGPT, Qwen u otra IA con visión junto al **screenshot de la vacante** (o pega el texto). La IA devuelve un JSON `SimulabV2` **exacto** que el sistema valida. Después, en **Etapa 1** pegas ese JSON (o lo cargas) y el flujo planeado arranca solo.

**Opciones de entrada** (elige una, no las mezcles):
1. `[imagen]` pega la captura de pantalla de la vacante.
2. `[texto]` pega el texto completo de la vacante.

---

## Prompt (copia todo lo siguiente)

```
Actúa como el compilador de rutas SIMULAB v2 del simulador laboral. A partir de
la VACANTE que te doy (imagen de captura o texto), genera UN ÚNICO objeto JSON
válido del formato "SIMULAB v2" (schema 2.0). No inventes requisitos que no estén
en la vacante, pero completa razonablemente lo implícito (p. ej. si pide "tableros"
asume BI; si pide "automatización" mapea n8n).

La vacante define una ruta que el sistema ejecuta en 3 Etapas:
- ETAPA 1 (diagnóstico): prueba de conocimiento teórico-práctico + coincidencia
  con la vacante → `match_pct` y porcentaje de entrevista.
- ETAPA 2 (seguimiento):
    * Modo A si match ≥ 75 → refuerzo simple + kit de postulación.
    * Modo B si match 40–75 → simulación intensiva con casos aplicados.
- ETAPA 3 (experiencia): ruta/carrera de aprendizaje por práctica continua en el
  entorno real simulado, para match < 40 o si la vacante exige experiencia.

=== VACANTE ===
[imagen]  → pega aquí el screenshot
— o —
[texto]   → pega aquí el texto
=== FIN VACANTE ===

Devuelve SOLO el JSON (sin bloques ```json ni comentarios), con esta estructura:

{
  "formato": "SIMULAB v2",
  "schema_version": "2.0",
  "id": "SIMULAB_<empresa_slug>_<puesto_slug>",
  "vacante": {
    "titulo": "string (puesto exacto)",
    "empresa": "string",
    "requiere_experiencia": bool,
    "min_years": number
  },
  "ruta": {
    "rama": "analyst | engineering | science | accounting",
    "arco_id": "string opcional",
    "task_types": ["string"]  // los taskType de los motores que usarás
  },
  "analisis_requerimientos": [
    {
      "requerimiento": "string",
      "tipo": "tecnica | herramienta | blanda | experiencia | escolaridad",
      "nivel_pedido": "string (p. ej. 'avanzado', '1-2 años')",
      "nivel_actual": "string ('nulo' por defecto; es el perfil real del alumno)",
      "brecha": "string corto describiendo la diferencia",
      "prioridad": "excluyente | importante | deseable | filtro"
    }
  ],
  "motor_mapping": [
    {
      "skill": "string (nombre del skill, p. ej. 'SQL', 'Power BI', 'n8n')",
      "capability": {
        "id": "string (id canónico de la tabla de capacidades abajo)",
        "skill": "string",
        "status": "exists | extends | missing",
        "label": "string",
        "icon": "string emoji",
        "tool": "string app del escritorio o vacío",
        "taskTypes": ["string"]  // solo si existe
      }
    }
  ],
  "engine_requirements": [
    // SOLO capacidades con status "missing" (motores que el sistema debe construir).
    // Cada una con id, skill, status "missing", label, gap (qué falta) y buildPlan.
  ],
  "etapas": {
    "etapa1": {
      "prueba": [
        {
          "id": "E1-0, E1-1, ...",
          "skill": "string",
          "pregunta": "string (pregunta teórico-práctica concreta del dominio)",
          "correcta": "string (respuesta correcta esperada)",
          "peso": number (1-100, la suma debe cubrir los skills clave)
        }
      ],
      "umbral_modo_a": 75
    },
    "etapa2": {
      "modo_a": {  // si el match llegará a ≥75 tras refuerzo
        "kit": ["string"],        // p. ej. 'CV a la medida de la vacante'
        "entrevista_star": ["string"]  // temas STAR sobre logros reales
      },
      "modo_b": {  // si el match está 40-75 → simulación intensiva
        "plan_intensivo": [  // tickets con las 5 reglas de caso aplicado
          {
            "id": "T1, T2, ...",
            "ticket": "string (caso de negocio realista)",
            "dependencias": ["string"],
            "teoria": ["string"],
            "practica": "string (tarea concreta validable por motor)",
            "herramientas": ["string (tool)"],
            "motor_mapping": {
              "skill": "string",
              "taskType": "string (id de workflow, ver tabla)",
              "validator": "string (de | ds)",
              "tool": "string",
              "golden": number (opcional, el resultado correcto esperado)
            },
            "criterio_cumplimiento": "string (qué debe cumplirse para cerrarlo)"
          }
        ]
      }
    },
    "etapa3": {
      "densidad": {
        "pesos": { "casos": 0.4, "complejidad": 0.2, "variedad": 0.15, "incidentes": 0.15, "resultados": 0.1 }
      },
      "evidencia": ["string"]
    }
  },
  "simulador_laboral": {
    "tickets": [ "los mismos tickets del plan_intensivo" ],
    "reglas": ["Un ticket se cierra solo con criterio cumplido, nunca por tiempo",
               "Cada entrega se versiona",
               "Cada ticket termina con explicación oral de 5 minutos"],
    "proyecto_integrador": "string (proyecto que cubre los gaps de la vacante)"
  },
  "entrevista": {
    "tecnica": ["string (preguntas técnicas)"],
    "conductual": ["string (STAR)"]
  },
  "criterios_listo_para_vacante": [
    "Responder 8 de 10 preguntas técnicas",
    "Cerrar los tickets del plan intensivo",
    "Proyecto integrador aprobado por el motor"
  ]
}

=== TABLA DE CAPACIDADES VÁLIDAS (usa estos ids exactos) ===
EXISTENTES (status "exists"; tool y taskTypes son referencia):
- sql        → skill "SQL",             tool "sql",        taskTypes ["sql_query"]
- etl        → skill "ETL",             tool "pipeline",    taskTypes ["etl_pipeline"]
- python     → skill "Python",          tool "notebook",    taskTypes ["etl_pipeline"]
- dbt        → skill "dbt",             tool "dbt",         taskTypes []
- quality    → skill "Calidad de datos", tool "catalog",     taskTypes ["data_quality"]
- incidents  → skill "Resolución de incidentes", tool "monitor", taskTypes ["incident_recovery"]
- airflow    → skill "Airflow",         tool "airflow",     taskTypes ["airflow_dag"]
- cloud      → skill "Cloud",           tool "cloud",       taskTypes []
- bi_looker  → skill "BI",              tool "bi",          taskTypes []
- ds_eda     → skill "EDA",             tool "stats",       taskTypes ["eda_churn"]
- ds_ml      → skill "ML",              tool "ml",          taskTypes ["modelo_baseline"]
- ds_metrics → skill "Métricas",        taskTypes ["eval_metricas"]
- cfdi       → skill "CFDI",            tool "accounting",  taskTypes ["invoice_emission","cfdi_reception","credit_note"]
- conciliacion → skill "Conciliación",  tool "banking",     taskTypes ["bank_reconciliation","ap_reconciliation"]
- nomina     → skill "Nómina",          tool "spreadsheet", taskTypes ["payroll"]
- fiscal     → skill "Fiscal",          tool "accounting",  taskTypes ["tax_calculation"]
- contabilidad → skill "Contabilidad",  tool "accounting",  taskTypes ["journal_entry","financial_statements","depreciation"]

EXTIENDE (status "extends" — existe pero requiere extensión):
- excel_advanced → skill "Excel", tool "spreadsheet"

FALTANTES (status "missing" — el sistema debe construirlos; inclúyelos en engine_requirements):
- power_bi → skill "Power BI", tool "bi", gap "motor de DAX/CALCULATE", buildPlan ["Motor DAX","PowerBISim","workflow DAX con golden"]
- forecast → skill "Pronóstico", gap "motor de pronóstico (media móvil, tendencia lineal)", buildPlan ["Motor PRONOSTICO","workflow pronóstico con golden"]
- n8n      → skill "Automatización", gap "motor de nodos/triggers/webhooks", buildPlan ["Motor nodos/triggers","Conexión a APIs y LLM","workflow automatización"]
- llm_api  → skill "APIs LLM", gap "motor de chat completions", buildPlan ["Motor chat completions","ApiClientSim a modelos LLM","workflow LLM"]
- agents   → skill "Agentes", gap "motor de loop agente→herramienta", buildPlan ["Motor agente (decisión, tools, memoria)","workflow agente"]
- prompt   → skill "Prompt engineering", gap "motor de prompts evaluables", buildPlan ["Motor prompts con rúbrica","comparación antes/después","workflow prompt"]
- erp      → skill "ERP", gap "plataforma ERP (TableStore, TransactionEngine, FormEngine)", buildPlan ["TableStore","TransactionEngine","FormEngine","ScenarioCatalog"]

=== REGLAS DE MAPEO ===
- Cada skill del `motor_mapping` usa UNO de los ids de la tabla anterior (el id canónico).
- Si un skill de la vacante NO tiene motor (p. ej. Power BI), usa el id "missing"
  correspondiente Y agrégalo a `engine_requirements`.
- Si la vacante pide experiencia (1+ años o "experiencia obligatoria") →
  `vacante.requiere_experiencia = true` y la Etapa 3 será "ruta/carrera por práctica
  continua en entorno real simulado" (experiencia comprobable por densidad).
- `ruta.rama` se deduce del skill dominante: SQL/Excel/BI/Power BI/Pronóstico →
  "analyst"; ETL/dbt/Airflow/Cloud/n8n/LLM/Agentes/ERP → "engineering";
  EDA/ML/Métricas → "science"; CFDI/Conciliación/Nómina/Fiscal/Contabilidad → "accounting".
- `etapa1.prueba` debe tener de 3 a 6 preguntas que cubran los skills clave, con
  pregunta teórico-práctica concreta y su respuesta esperada.
- `motor_mapping[].capability.golden` NO lo inventes: déjalo fuera salvo que el
  motor real ya tenga un golden conocido (p. ej. el mart dbt = 128350).
- Devuelve exclusivamente el JSON. Nada más.
```

---

## Cómo se usa en el flujo (Etapa 1 → 2 → 3)

1. **Etapa 1 — Diagnóstico**: pega el JSON devuelto en `POST /api/automator/validate`
   (o la pantalla Etapa 1 del Career Center). El sistema valida el `SimulabV2`
   (`validateSimulabV2`) y lee `etapa1.prueba` → aplica la prueba teórico-práctica
   → calcula `match_pct` (coincidencia con la vacante) y el porcentaje de entrevista.
2. **Etapa 2 — Seguimiento** (según el match obtenido):
   - **match ≥ 75 → Modo A**: refuerzo simple + kit de postulación (CV a la medida,
     entrevista STAR, checklist).
   - **match 40–75 → Modo B**: simulación intensiva con los tickets `plan_intensivo`
     (casos aplicados validables por motor) y reevaluación hasta cruzar 75.
3. **Etapa 3 — Experiencia** (match < 40 o experiencia obligatoria): ruta/carrera de
   aprendizaje mediante práctica continua en el entorno real simulado; la densidad de
   experiencia (0-1) se acumula con casos, complejidad, variedad, incidentes y
   resultados, y es la evidencia del expediente (R-08) para la postulación.

## Notas
- El prompt funciona con **imagen o texto**; con imagen la IA hace OCR/visión y
  extrae los requisitos de la captura.
- Mantén intactas las tablas de capacidades: son la fuente de los `id` válidos que
  el validador espera.
- Si la IA omite `engine_requirements` para un skill `missing`, el validador emite
  un *warning*, no un error (`valid` sigue siendo `true`), pero es mejor incluirlos
  para que el sistema sepa qué motor construir.