-- ============================================================
-- Sistema de Evaluacion de Ferias Institucionales
-- Database Schema for Supabase (PostgreSQL)
-- ============================================================

-- 1. ROLES table
CREATE TABLE IF NOT EXISTS roles (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  TEXT NOT NULL UNIQUE
);

INSERT INTO roles (nombre) VALUES
    ('Juez'),
    ('administrador')
ON CONFLICT (nombre) DO NOTHING;


-- 2. USUARIOS table
CREATE TABLE IF NOT EXISTS usuarios (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           TEXT NOT NULL UNIQUE,
    contrasena_hash  TEXT NOT NULL,
    role_id          BIGINT NOT NULL REFERENCES roles(id),
    tipo_feria       TEXT NOT NULL DEFAULT 'Feria Cientifica y Tecnologica',

    CONSTRAINT chk_tipo_feria CHECK (
        tipo_feria IN (
            'Feria Cientifica y Tecnologica',
            'Feria Expotecnica',
            'Festival Estudiantil de las Artes'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON usuarios (nombre);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios (role_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_feria ON usuarios (tipo_feria);


-- 3. PROYECTOS_FERIAS table
CREATE TABLE IF NOT EXISTS proyectos_ferias (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proyectos_ferias_titulo ON proyectos_ferias (titulo);


-- 4. ASIGNACIONES_JUECES table
CREATE TABLE IF NOT EXISTS asignaciones_jueces (
    juez_id     BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    proyecto_id BIGINT NOT NULL REFERENCES proyectos_ferias(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (juez_id, proyecto_id)
);

CREATE INDEX IF NOT EXISTS idx_asignaciones_jueces_juez ON asignaciones_jueces (juez_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_jueces_proyecto ON asignaciones_jueces (proyecto_id);


-- 5. EVALUACIONES_PROYECTOS table
CREATE TABLE IF NOT EXISTS evaluaciones_proyectos (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id BIGINT NOT NULL REFERENCES proyectos_ferias(id) ON DELETE CASCADE,
    juez_id     BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criterio    TEXT NOT NULL,
    nota        NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_evaluacion_por_criterio UNIQUE (proyecto_id, juez_id, criterio),
    CONSTRAINT chk_nota_range CHECK (nota >= 0 AND nota <= 3)
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_proyecto ON evaluaciones_proyectos (proyecto_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_juez ON evaluaciones_proyectos (juez_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_created_at ON evaluaciones_proyectos (created_at);


-- 6. VIEW: RESULTADOS_FINALES_PROYECTOS
CREATE OR REPLACE VIEW resultados_finales_proyectos AS
SELECT
    p.id                                                          AS proyecto_id,
    p.titulo,
    COALESCE(SUM(e.nota), 0)                                      AS resultado_final,
    COUNT(DISTINCT e.juez_id)                                     AS total_jueces
FROM proyectos_ferias p
LEFT JOIN evaluaciones_proyectos e ON e.proyecto_id = p.id
GROUP BY p.id, p.titulo
ORDER BY p.titulo;
