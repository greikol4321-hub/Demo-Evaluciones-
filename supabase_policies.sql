CREATE POLICY usuarios_update_all ON usuarios FOR UPDATE USING (true);
CREATE POLICY usuarios_delete_all ON usuarios FOR DELETE USING (true);
CREATE POLICY usuarios_insert_all ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY evaluaciones_insert_all ON evaluaciones_proyectos FOR INSERT WITH CHECK (true);
CREATE POLICY asignaciones_insert_all ON asignaciones_jueces FOR INSERT WITH CHECK (true);
CREATE POLICY asignaciones_delete_all ON asignaciones_jueces FOR DELETE USING (true);
