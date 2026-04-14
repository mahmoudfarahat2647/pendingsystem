-- app_settings: single-row table for globally shared app configuration.
-- CHECK (id = 1) enforces only one row ever exists.
-- DEFAULT values match the current Zustand initial state so first load is invisible to the user.
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  models JSONB NOT NULL DEFAULT '["Megane IV","Clio V","Kadjar","Captur II","Duster II","Talisman"]',
  repair_systems JSONB NOT NULL DEFAULT '["Mechanical","Electrical","Body","ضمان"]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ADD CONSTRAINT single_row CHECK (id = 1);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
