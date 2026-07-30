CREATE POLICY "Admins manage school documents"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'school-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'school-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers view school documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-documents' AND public.has_role(auth.uid(), 'teacher'));