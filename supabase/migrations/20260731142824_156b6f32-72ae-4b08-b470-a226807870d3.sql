-- ============ PART 1: profile safety ============
CREATE OR REPLACE FUNCTION public.ensure_own_profile(_full_name text DEFAULT NULL, _email text DEFAULT NULL)
RETURNS TABLE(full_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (auth.uid(), COALESCE(NULLIF(BTRIM(_full_name), ''), ''), _email)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = CASE WHEN COALESCE(NULLIF(BTRIM(EXCLUDED.full_name), ''), '') <> '' AND COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), '') = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
        email = COALESCE(public.profiles.email, EXCLUDED.email);

  RETURN QUERY SELECT p.full_name, p.email FROM public.profiles p WHERE p.user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_own_profile(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_own_profile(text, text) TO authenticated;

-- ============ PART 2: FINANCE ============

-- Student fee profiles
CREATE TABLE public.student_fee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  tuition numeric NOT NULL DEFAULT 0,
  hostel numeric NOT NULL DEFAULT 0,
  food numeric NOT NULL DEFAULT 0,
  transport numeric NOT NULL DEFAULT 0,
  exam_fee numeric NOT NULL DEFAULT 0,
  library numeric NOT NULL DEFAULT 0,
  development numeric NOT NULL DEFAULT 0,
  admission numeric NOT NULL DEFAULT 0,
  session_charge numeric NOT NULL DEFAULT 0,
  special_coaching numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none','percentage','fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  scholarship_note text,
  manual_override numeric,
  previous_arrears numeric NOT NULL DEFAULT 0,
  advance_balance numeric NOT NULL DEFAULT 0,
  late_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_fee_profiles TO authenticated;
GRANT ALL ON public.student_fee_profiles TO service_role;
ALTER TABLE public.student_fee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fee profiles" ON public.student_fee_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view own fee profile" ON public.student_fee_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

-- Invoices
CREATE SEQUENCE IF NOT EXISTS public.invoice_no_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS public.receipt_no_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS public.payslip_no_seq START 1000;

CREATE TABLE public.student_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(), 'YYYYMM') || '-' || nextval('public.invoice_no_seq')),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  billing_month date NOT NULL,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  gross_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  arrears numeric NOT NULL DEFAULT 0,
  advance_applied numeric NOT NULL DEFAULT 0,
  late_fee numeric NOT NULL DEFAULT 0,
  total_payable numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, billing_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_invoices TO authenticated;
GRANT ALL ON public.student_invoices TO service_role;
ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.student_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view own invoices" ON public.student_invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no text NOT NULL UNIQUE DEFAULT ('RCPT-' || to_char(now(), 'YYYYMM') || '-' || nextval('public.receipt_no_seq')),
  invoice_id uuid NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('bkash','nagad','bank','cash')),
  reference_no text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  collected_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoice payments" ON public.invoice_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view own payments" ON public.invoice_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

-- Teacher salary profiles
CREATE TABLE public.teacher_salary_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL UNIQUE REFERENCES public.teachers(id) ON DELETE CASCADE,
  basic_salary numeric NOT NULL DEFAULT 0,
  house_rent numeric NOT NULL DEFAULT 0,
  medical numeric NOT NULL DEFAULT 0,
  transport numeric NOT NULL DEFAULT 0,
  festival_bonus numeric NOT NULL DEFAULT 0,
  overtime numeric NOT NULL DEFAULT 0,
  seniority_allowance numeric NOT NULL DEFAULT 0,
  provident_fund numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  loan_installment numeric NOT NULL DEFAULT 0,
  absence_deduction numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_salary_profiles TO authenticated;
GRANT ALL ON public.teacher_salary_profiles TO service_role;
ALTER TABLE public.teacher_salary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage salary profiles" ON public.teacher_salary_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers view own salary profile" ON public.teacher_salary_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE TABLE public.teacher_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_no text NOT NULL UNIQUE DEFAULT ('PS-' || to_char(now(), 'YYYYMM') || '-' || nextval('public.payslip_no_seq')),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  salary_month date NOT NULL,
  earnings jsonb NOT NULL DEFAULT '{}'::jsonb,
  deductions jsonb NOT NULL DEFAULT '{}'::jsonb,
  gross_earnings numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  net_salary numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  method text CHECK (method IN ('bank','bkash','nagad','cash')),
  paid_on date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, salary_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_payslips TO authenticated;
GRANT ALL ON public.teacher_payslips TO service_role;
ALTER TABLE public.teacher_payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payslips" ON public.teacher_payslips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers view own payslips" ON public.teacher_payslips FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

-- Expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('food_mess','utilities','staff_salaries','maintenance','transport','admin_academic','others')),
  subcategory text,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text,
  method text CHECK (method IN ('bank','bkash','nagad','cash')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','salary')),
  source_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage expenses" ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ledger
CREATE TABLE public.finance_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text NOT NULL CHECK (entry_type IN ('income','expense')),
  category text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  source_table text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_finance_ledger_date ON public.finance_ledger(entry_date);
CREATE UNIQUE INDEX idx_finance_ledger_source ON public.finance_ledger(source_table, source_id) WHERE source_id IS NOT NULL;
GRANT SELECT ON public.finance_ledger TO authenticated;
GRANT ALL ON public.finance_ledger TO service_role;
ALTER TABLE public.finance_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view ledger" ON public.finance_ledger FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER trg_sfp_updated BEFORE UPDATE ON public.student_fee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.student_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tsp_updated BEFORE UPDATE ON public.teacher_salary_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ps_updated BEFORE UPDATE ON public.teacher_payslips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exp_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ledger automation: fee payment -> income, invoice status update
CREATE OR REPLACE FUNCTION public.handle_invoice_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  paid_total numeric;
  payable numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO paid_total FROM public.invoice_payments WHERE invoice_id = NEW.invoice_id;
  SELECT total_payable INTO payable FROM public.student_invoices WHERE id = NEW.invoice_id;

  UPDATE public.student_invoices
  SET amount_paid = paid_total,
      status = CASE WHEN paid_total >= payable AND payable > 0 THEN 'paid'
                    WHEN paid_total > 0 THEN 'partial' ELSE 'unpaid' END
  WHERE id = NEW.invoice_id;

  INSERT INTO public.finance_ledger (entry_date, entry_type, category, description, amount, source_table, source_id)
  VALUES (NEW.payment_date, 'income', 'student_fees',
          'Fee payment receipt ' || NEW.receipt_no, NEW.amount, 'invoice_payments', NEW.id)
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_invoice_payment AFTER INSERT ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_payment();

-- Payslip paid -> expense + ledger
CREATE OR REPLACE FUNCTION public.handle_payslip_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t_name text;
  exp_id uuid;
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status <> 'paid') THEN
    SELECT full_name INTO t_name FROM public.teachers WHERE id = NEW.teacher_id;

    INSERT INTO public.expenses (category, subcategory, description, amount, expense_date, method, source, source_id)
    VALUES ('staff_salaries', 'teaching_staff',
            'Salary ' || to_char(NEW.salary_month, 'Mon YYYY') || ' - ' || COALESCE(t_name, 'Teacher'),
            NEW.net_salary, COALESCE(NEW.paid_on, CURRENT_DATE), NEW.method, 'salary', NEW.id)
    RETURNING id INTO exp_id;

    INSERT INTO public.finance_ledger (entry_date, entry_type, category, description, amount, source_table, source_id)
    VALUES (COALESCE(NEW.paid_on, CURRENT_DATE), 'expense', 'staff_salaries',
            'Payslip ' || NEW.payslip_no || ' - ' || COALESCE(t_name, 'Teacher'), NEW.net_salary, 'teacher_payslips', NEW.id)
    ON CONFLICT (source_table, source_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_payslip_paid AFTER INSERT OR UPDATE ON public.teacher_payslips
FOR EACH ROW EXECUTE FUNCTION public.handle_payslip_paid();

-- Expense -> ledger (skip salary-sourced double count: salary already logged)
CREATE OR REPLACE FUNCTION public.handle_expense_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source = 'manual' THEN
    INSERT INTO public.finance_ledger (entry_date, entry_type, category, description, amount, source_table, source_id)
    VALUES (NEW.expense_date, 'expense', NEW.category,
            COALESCE(NEW.description, NEW.subcategory, NEW.category), NEW.amount, 'expenses', NEW.id)
    ON CONFLICT (source_table, source_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_expense_ledger AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.handle_expense_ledger();

CREATE OR REPLACE FUNCTION public.handle_expense_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.finance_ledger WHERE source_table = 'expenses' AND source_id = OLD.id;
  RETURN OLD;
END;
$$;
CREATE TRIGGER trg_expense_delete AFTER DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.handle_expense_delete();

-- ===== RPCs =====
CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(_month date)
RETURNS TABLE(created_count integer, skipped_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m date := date_trunc('month', _month)::date;
  rec record;
  gross numeric;
  disc numeric;
  payable numeric;
  created integer := 0;
  skipped integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can generate invoices';
  END IF;

  FOR rec IN SELECT p.*, s.full_name FROM public.student_fee_profiles p JOIN public.students s ON s.id = p.student_id LOOP
    IF EXISTS (SELECT 1 FROM public.student_invoices i WHERE i.student_id = rec.student_id AND i.billing_month = m) THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    gross := rec.tuition + rec.hostel + rec.food + rec.transport + rec.exam_fee + rec.library
           + rec.development + rec.admission + rec.session_charge + rec.special_coaching;
    disc := CASE WHEN rec.discount_type = 'percentage' THEN gross * rec.discount_value / 100
                 WHEN rec.discount_type = 'fixed' THEN rec.discount_value ELSE 0 END;
    payable := COALESCE(rec.manual_override, GREATEST(gross - disc, 0) + rec.previous_arrears - rec.advance_balance + rec.late_fee);

    INSERT INTO public.student_invoices (student_id, billing_month, components, gross_amount, discount_amount,
      arrears, advance_applied, late_fee, total_payable)
    VALUES (rec.student_id, m,
      jsonb_build_object('tuition', rec.tuition, 'hostel', rec.hostel, 'food', rec.food, 'transport', rec.transport,
        'exam_fee', rec.exam_fee, 'library', rec.library, 'development', rec.development, 'admission', rec.admission,
        'session_charge', rec.session_charge, 'special_coaching', rec.special_coaching),
      gross, disc, rec.previous_arrears, rec.advance_balance, rec.late_fee, GREATEST(payable, 0));
    created := created + 1;
  END LOOP;

  RETURN QUERY SELECT created, skipped;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_monthly_invoices(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_monthly_payslips(_month date)
RETURNS TABLE(created_count integer, skipped_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m date := date_trunc('month', _month)::date;
  rec record;
  gross numeric;
  ded numeric;
  created integer := 0;
  skipped integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can generate payslips';
  END IF;

  FOR rec IN SELECT * FROM public.teacher_salary_profiles LOOP
    IF EXISTS (SELECT 1 FROM public.teacher_payslips p WHERE p.teacher_id = rec.teacher_id AND p.salary_month = m) THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    gross := rec.basic_salary + rec.house_rent + rec.medical + rec.transport + rec.festival_bonus + rec.overtime + rec.seniority_allowance;
    ded := rec.provident_fund + rec.tax + rec.loan_installment + rec.absence_deduction;

    INSERT INTO public.teacher_payslips (teacher_id, salary_month, earnings, deductions, gross_earnings, total_deductions, net_salary)
    VALUES (rec.teacher_id, m,
      jsonb_build_object('basic_salary', rec.basic_salary, 'house_rent', rec.house_rent, 'medical', rec.medical,
        'transport', rec.transport, 'festival_bonus', rec.festival_bonus, 'overtime', rec.overtime,
        'seniority_allowance', rec.seniority_allowance),
      jsonb_build_object('provident_fund', rec.provident_fund, 'tax', rec.tax,
        'loan_installment', rec.loan_installment, 'absence_deduction', rec.absence_deduction),
      gross, ded, GREATEST(gross - ded, 0));
    created := created + 1;
  END LOOP;

  RETURN QUERY SELECT created, skipped;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_monthly_payslips(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_monthly_payslips(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.finance_summary(_month date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  fees_collected numeric, fees_due numeric, fees_billed numeric,
  salaries_paid numeric, salaries_pending numeric,
  other_expenses numeric, total_income numeric, total_expense numeric, net_balance numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m date := date_trunc('month', _month)::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view finance summary';
  END IF;

  RETURN QUERY
  WITH inv AS (
    SELECT COALESCE(SUM(total_payable),0) AS billed, COALESCE(SUM(amount_paid),0) AS paid
    FROM public.student_invoices WHERE billing_month = m
  ),
  sal AS (
    SELECT COALESCE(SUM(CASE WHEN status='paid' THEN net_salary ELSE 0 END),0) AS paid,
           COALESCE(SUM(CASE WHEN status<>'paid' THEN net_salary ELSE 0 END),0) AS pending
    FROM public.teacher_payslips WHERE salary_month = m
  ),
  led AS (
    SELECT COALESCE(SUM(CASE WHEN entry_type='income' THEN amount ELSE 0 END),0) AS inc,
           COALESCE(SUM(CASE WHEN entry_type='expense' THEN amount ELSE 0 END),0) AS exp,
           COALESCE(SUM(CASE WHEN entry_type='expense' AND category<>'staff_salaries' THEN amount ELSE 0 END),0) AS other_exp
    FROM public.finance_ledger
    WHERE entry_date >= m AND entry_date < (m + interval '1 month')
  )
  SELECT inv.paid, GREATEST(inv.billed - inv.paid, 0), inv.billed,
         sal.paid, sal.pending, led.other_exp, led.inc, led.exp, led.inc - led.exp
  FROM inv, sal, led;
END;
$$;
REVOKE ALL ON FUNCTION public.finance_summary(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_summary(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.expense_breakdown(_month date DEFAULT CURRENT_DATE)
RETURNS TABLE(category text, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m date := date_trunc('month', _month)::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view expense breakdown';
  END IF;

  RETURN QUERY
  SELECT l.category, SUM(l.amount)::numeric
  FROM public.finance_ledger l
  WHERE l.entry_type = 'expense' AND l.entry_date >= m AND l.entry_date < (m + interval '1 month')
  GROUP BY l.category
  ORDER BY 2 DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.expense_breakdown(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expense_breakdown(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.finance_trend(_months integer DEFAULT 12)
RETURNS TABLE(month date, income numeric, expense numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := GREATEST(LEAST(COALESCE(_months, 12), 24), 1);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view finance trend';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT generate_series(date_trunc('month', CURRENT_DATE) - ((n - 1) || ' month')::interval,
                           date_trunc('month', CURRENT_DATE), '1 month')::date AS m
  )
  SELECT months.m,
    COALESCE((SELECT SUM(amount) FROM public.finance_ledger l WHERE l.entry_type='income'
              AND l.entry_date >= months.m AND l.entry_date < months.m + interval '1 month'), 0)::numeric,
    COALESCE((SELECT SUM(amount) FROM public.finance_ledger l WHERE l.entry_type='expense'
              AND l.entry_date >= months.m AND l.entry_date < months.m + interval '1 month'), 0)::numeric
  FROM months ORDER BY months.m;
END;
$$;
REVOKE ALL ON FUNCTION public.finance_trend(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_trend(integer) TO authenticated;