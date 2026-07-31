export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          class: string
          created_at: string
          date: string | null
          exam_name: string
          id: string
          max_marks: number
          pass_marks: number
          subject: string
        }
        Insert: {
          class: string
          created_at?: string
          date?: string | null
          exam_name: string
          id?: string
          max_marks?: number
          pass_marks?: number
          subject: string
        }
        Update: {
          class?: string
          created_at?: string
          date?: string | null
          exam_name?: string
          id?: string
          max_marks?: number
          pass_marks?: number
          subject?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          method: string | null
          source: string
          source_id: string | null
          subcategory: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          method?: string | null
          source?: string
          source_id?: string | null
          subcategory?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          method?: string | null
          source?: string
          source_id?: string | null
          subcategory?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string
          fee_id: string
          id: string
          payment_date: string
          status: string
          student_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          fee_id: string
          id?: string
          payment_date?: string
          status?: string
          student_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          fee_id?: string
          id?: string
          payment_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          class: string
          created_at: string
          due_date: string | null
          fee_type: string
          id: string
        }
        Insert: {
          amount?: number
          class: string
          created_at?: string
          due_date?: string | null
          fee_type: string
          id?: string
        }
        Update: {
          amount?: number
          class?: string
          created_at?: string
          due_date?: string | null
          fee_type?: string
          id?: string
        }
        Relationships: []
      }
      finance_ledger: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          source_id: string | null
          source_table: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          source_id?: string | null
          source_table?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          source_id?: string | null
          source_table?: string | null
        }
        Relationships: []
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          id: string
          income: number | null
          mobile: string | null
          name: string
          occupation: string | null
          relation: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          income?: number | null
          mobile?: string | null
          name: string
          occupation?: string | null
          relation?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          income?: number | null
          mobile?: string | null
          name?: string
          occupation?: string | null
          relation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          id: string
          invoice_id: string
          method: string
          payment_date: string
          receipt_no: string
          reference_no: string | null
          student_id: string
        }
        Insert: {
          amount: number
          collected_by?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          payment_date?: string
          receipt_no?: string
          reference_no?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          payment_date?: string
          receipt_no?: string
          reference_no?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_status: boolean
          receiver_id: string
          receiver_role: string
          sender_id: string
          sender_role: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_status?: boolean
          receiver_id: string
          receiver_role: string
          sender_id: string
          sender_role: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_status?: boolean
          receiver_id?: string
          receiver_role?: string
          sender_id?: string
          sender_role?: string
          subject?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          mobile: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks: number
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks: number
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          class: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          period_number: number
          start_time: string
          subject: string
          teacher_id: string | null
        }
        Insert: {
          class: string
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          period_number: number
          start_time: string
          subject: string
          teacher_id?: string | null
        }
        Update: {
          class?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          period_number?: number
          start_time?: string
          subject?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_profiles: {
        Row: {
          admission: number
          advance_balance: number
          created_at: string
          development: number
          discount_type: string
          discount_value: number
          exam_fee: number
          food: number
          hostel: number
          id: string
          late_fee: number
          library: number
          manual_override: number | null
          previous_arrears: number
          scholarship_note: string | null
          session_charge: number
          special_coaching: number
          student_id: string
          transport: number
          tuition: number
          updated_at: string
        }
        Insert: {
          admission?: number
          advance_balance?: number
          created_at?: string
          development?: number
          discount_type?: string
          discount_value?: number
          exam_fee?: number
          food?: number
          hostel?: number
          id?: string
          late_fee?: number
          library?: number
          manual_override?: number | null
          previous_arrears?: number
          scholarship_note?: string | null
          session_charge?: number
          special_coaching?: number
          student_id: string
          transport?: number
          tuition?: number
          updated_at?: string
        }
        Update: {
          admission?: number
          advance_balance?: number
          created_at?: string
          development?: number
          discount_type?: string
          discount_value?: number
          exam_fee?: number
          food?: number
          hostel?: number
          id?: string
          late_fee?: number
          library?: number
          manual_override?: number | null
          previous_arrears?: number
          scholarship_note?: string | null
          session_charge?: number
          special_coaching?: number
          student_id?: string
          transport?: number
          tuition?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invoices: {
        Row: {
          advance_applied: number
          amount_paid: number
          arrears: number
          billing_month: string
          components: Json
          created_at: string
          discount_amount: number
          gross_amount: number
          id: string
          invoice_no: string
          late_fee: number
          note: string | null
          status: string
          student_id: string
          total_payable: number
          updated_at: string
        }
        Insert: {
          advance_applied?: number
          amount_paid?: number
          arrears?: number
          billing_month: string
          components?: Json
          created_at?: string
          discount_amount?: number
          gross_amount?: number
          id?: string
          invoice_no?: string
          late_fee?: number
          note?: string | null
          status?: string
          student_id: string
          total_payable?: number
          updated_at?: string
        }
        Update: {
          advance_applied?: number
          amount_paid?: number
          arrears?: number
          billing_month?: string
          components?: Json
          created_at?: string
          discount_amount?: number
          gross_amount?: number
          id?: string
          invoice_no?: string
          late_fee?: number
          note?: string | null
          status?: string
          student_id?: string
          total_payable?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_date: string | null
          admission_exam_score: string | null
          allergies: string | null
          annual_family_income: number | null
          birth_certificate_no: string | null
          birth_certificate_url: string | null
          blood_group: string | null
          board_reg_no: string | null
          board_roll_no: string | null
          created_at: string
          current_class: string
          disease_disability: string | null
          dob: string | null
          email: string | null
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          father_mobile: string | null
          father_name: string | null
          father_nid: string | null
          father_profession: string | null
          full_name: string
          full_name_bn: string | null
          gender: string | null
          guardian_address: string | null
          guardian_id: string | null
          guardian_name: string | null
          guardian_nid_url: string | null
          guardian_occupation: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          is_first_login: boolean
          last_class_passed: string | null
          last_exam_result: string | null
          local_guardian_mobile: string | null
          local_guardian_name: string | null
          local_guardian_relation: string | null
          marksheet_url: string | null
          mobile: string | null
          mother_mobile: string | null
          mother_name: string | null
          mother_nid: string | null
          mother_profession: string | null
          nationality: string | null
          parents_names: string | null
          permanent_district: string | null
          permanent_po: string | null
          permanent_upazila: string | null
          permanent_village: string | null
          photo_url: string | null
          present_district: string | null
          present_po: string | null
          present_upazila: string | null
          present_village: string | null
          previous_school_address: string | null
          previous_school_name: string | null
          religion: string | null
          residential_status: string | null
          roll_number: string | null
          section: string | null
          student_group: string | null
          tc_no: string | null
          tc_url: string | null
          user_id: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          admission_date?: string | null
          admission_exam_score?: string | null
          allergies?: string | null
          annual_family_income?: number | null
          birth_certificate_no?: string | null
          birth_certificate_url?: string | null
          blood_group?: string | null
          board_reg_no?: string | null
          board_roll_no?: string | null
          created_at?: string
          current_class: string
          disease_disability?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          father_mobile?: string | null
          father_name?: string | null
          father_nid?: string | null
          father_profession?: string | null
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          guardian_address?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_nid_url?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          is_first_login?: boolean
          last_class_passed?: string | null
          last_exam_result?: string | null
          local_guardian_mobile?: string | null
          local_guardian_name?: string | null
          local_guardian_relation?: string | null
          marksheet_url?: string | null
          mobile?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          mother_nid?: string | null
          mother_profession?: string | null
          nationality?: string | null
          parents_names?: string | null
          permanent_district?: string | null
          permanent_po?: string | null
          permanent_upazila?: string | null
          permanent_village?: string | null
          photo_url?: string | null
          present_district?: string | null
          present_po?: string | null
          present_upazila?: string | null
          present_village?: string | null
          previous_school_address?: string | null
          previous_school_name?: string | null
          religion?: string | null
          residential_status?: string | null
          roll_number?: string | null
          section?: string | null
          student_group?: string | null
          tc_no?: string | null
          tc_url?: string | null
          user_id?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          admission_date?: string | null
          admission_exam_score?: string | null
          allergies?: string | null
          annual_family_income?: number | null
          birth_certificate_no?: string | null
          birth_certificate_url?: string | null
          blood_group?: string | null
          board_reg_no?: string | null
          board_roll_no?: string | null
          created_at?: string
          current_class?: string
          disease_disability?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          father_mobile?: string | null
          father_name?: string | null
          father_nid?: string | null
          father_profession?: string | null
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          guardian_address?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_nid_url?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          is_first_login?: boolean
          last_class_passed?: string | null
          last_exam_result?: string | null
          local_guardian_mobile?: string | null
          local_guardian_name?: string | null
          local_guardian_relation?: string | null
          marksheet_url?: string | null
          mobile?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          mother_nid?: string | null
          mother_profession?: string | null
          nationality?: string | null
          parents_names?: string | null
          permanent_district?: string | null
          permanent_po?: string | null
          permanent_upazila?: string | null
          permanent_village?: string | null
          photo_url?: string | null
          present_district?: string | null
          present_po?: string | null
          present_upazila?: string | null
          present_village?: string | null
          previous_school_address?: string | null
          previous_school_name?: string | null
          religion?: string | null
          residential_status?: string | null
          roll_number?: string | null
          section?: string | null
          student_group?: string | null
          tc_no?: string | null
          tc_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_payslips: {
        Row: {
          created_at: string
          deductions: Json
          earnings: Json
          gross_earnings: number
          id: string
          method: string | null
          net_salary: number
          note: string | null
          paid_on: string | null
          payslip_no: string
          salary_month: string
          status: string
          teacher_id: string
          total_deductions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deductions?: Json
          earnings?: Json
          gross_earnings?: number
          id?: string
          method?: string | null
          net_salary?: number
          note?: string | null
          paid_on?: string | null
          payslip_no?: string
          salary_month: string
          status?: string
          teacher_id: string
          total_deductions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deductions?: Json
          earnings?: Json
          gross_earnings?: number
          id?: string
          method?: string | null
          net_salary?: number
          note?: string | null
          paid_on?: string | null
          payslip_no?: string
          salary_month?: string
          status?: string
          teacher_id?: string
          total_deductions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_payslips_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_salary_profiles: {
        Row: {
          absence_deduction: number
          basic_salary: number
          created_at: string
          festival_bonus: number
          house_rent: number
          id: string
          loan_installment: number
          medical: number
          overtime: number
          provident_fund: number
          seniority_allowance: number
          tax: number
          teacher_id: string
          transport: number
          updated_at: string
        }
        Insert: {
          absence_deduction?: number
          basic_salary?: number
          created_at?: string
          festival_bonus?: number
          house_rent?: number
          id?: string
          loan_installment?: number
          medical?: number
          overtime?: number
          provident_fund?: number
          seniority_allowance?: number
          tax?: number
          teacher_id: string
          transport?: number
          updated_at?: string
        }
        Update: {
          absence_deduction?: number
          basic_salary?: number
          created_at?: string
          festival_bonus?: number
          house_rent?: number
          id?: string
          loan_installment?: number
          medical?: number
          overtime?: number
          provident_fund?: number
          seniority_allowance?: number
          tax?: number
          teacher_id?: string
          transport?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_salary_profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          applied_post: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_name: string | null
          bed_med: string | null
          blood_group: string | null
          class_assigned: string | null
          created_at: string
          cv_url: string | null
          department: string | null
          dob: string | null
          education_certificate_urls: string[]
          email: string | null
          employment_type: string | null
          expected_salary: number | null
          experience_certificate_url: string | null
          father_husband_name: string | null
          full_name: string
          gender: string | null
          id: string
          is_first_login: boolean
          joining_date: string | null
          madrasa_certificates: string | null
          marital_status: string | null
          mobile: string | null
          mobile_banking_no: string | null
          mother_name: string | null
          national_id: string | null
          nid: string | null
          nid_scan_url: string | null
          no_criminal_record: boolean
          parents_names: string | null
          permanent_address: string | null
          photo_url: string | null
          physically_fit: boolean
          police_clearance_url: string | null
          present_address: string | null
          previous_jobs: Json
          probation_period: string | null
          qualification: string | null
          qualifications: Json
          reference_contacts: Json
          religion: string | null
          routing_no: string | null
          salary: number | null
          special_training: string | null
          subject: string | null
          tin: string | null
          total_experience_years: number | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          applied_post?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bed_med?: string | null
          blood_group?: string | null
          class_assigned?: string | null
          created_at?: string
          cv_url?: string | null
          department?: string | null
          dob?: string | null
          education_certificate_urls?: string[]
          email?: string | null
          employment_type?: string | null
          expected_salary?: number | null
          experience_certificate_url?: string | null
          father_husband_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_first_login?: boolean
          joining_date?: string | null
          madrasa_certificates?: string | null
          marital_status?: string | null
          mobile?: string | null
          mobile_banking_no?: string | null
          mother_name?: string | null
          national_id?: string | null
          nid?: string | null
          nid_scan_url?: string | null
          no_criminal_record?: boolean
          parents_names?: string | null
          permanent_address?: string | null
          photo_url?: string | null
          physically_fit?: boolean
          police_clearance_url?: string | null
          present_address?: string | null
          previous_jobs?: Json
          probation_period?: string | null
          qualification?: string | null
          qualifications?: Json
          reference_contacts?: Json
          religion?: string | null
          routing_no?: string | null
          salary?: number | null
          special_training?: string | null
          subject?: string | null
          tin?: string | null
          total_experience_years?: number | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          applied_post?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bed_med?: string | null
          blood_group?: string | null
          class_assigned?: string | null
          created_at?: string
          cv_url?: string | null
          department?: string | null
          dob?: string | null
          education_certificate_urls?: string[]
          email?: string | null
          employment_type?: string | null
          expected_salary?: number | null
          experience_certificate_url?: string | null
          father_husband_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_first_login?: boolean
          joining_date?: string | null
          madrasa_certificates?: string | null
          marital_status?: string | null
          mobile?: string | null
          mobile_banking_no?: string | null
          mother_name?: string | null
          national_id?: string | null
          nid?: string | null
          nid_scan_url?: string | null
          no_criminal_record?: boolean
          parents_names?: string | null
          permanent_address?: string | null
          photo_url?: string | null
          physically_fit?: boolean
          police_clearance_url?: string | null
          present_address?: string | null
          previous_jobs?: Json
          probation_period?: string | null
          qualification?: string | null
          qualifications?: Json
          reference_contacts?: Json
          religion?: string | null
          routing_no?: string | null
          salary?: number | null
          special_training?: string | null
          subject?: string | null
          tin?: string | null
          total_experience_years?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      complete_first_login: { Args: never; Returns: boolean }
      ensure_own_profile: {
        Args: { _email?: string; _full_name?: string }
        Returns: {
          email: string
          full_name: string
        }[]
      }
      expense_breakdown: {
        Args: { _month?: string }
        Returns: {
          category: string
          total: number
        }[]
      }
      finance_summary: {
        Args: { _month?: string }
        Returns: {
          fees_billed: number
          fees_collected: number
          fees_due: number
          net_balance: number
          other_expenses: number
          salaries_paid: number
          salaries_pending: number
          total_expense: number
          total_income: number
        }[]
      }
      finance_trend: {
        Args: { _months?: number }
        Returns: {
          expense: number
          income: number
          month: string
        }[]
      }
      generate_monthly_invoices: {
        Args: { _month: string }
        Returns: {
          created_count: number
          skipped_count: number
        }[]
      }
      generate_monthly_payslips: {
        Args: { _month: string }
        Returns: {
          created_count: number
          skipped_count: number
        }[]
      }
      get_current_user_access_context: {
        Args: never
        Returns: {
          is_first_login: boolean
          login_id: string
          user_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_message_directory: {
        Args: never
        Returns: {
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_public_notices: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          description: string
          id: string
          image_url: string
          title: string
        }[]
      }
      get_student_roster: {
        Args: { _class?: string }
        Returns: {
          current_class: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          id: string
          roll_number: string
          section: string
          student_group: string
        }[]
      }
      get_teacher_directory: {
        Args: never
        Returns: {
          class_assigned: string
          department: string
          full_name: string
          id: string
          subject: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_student_login_id: { Args: never; Returns: string }
      next_teacher_login_id: { Args: never; Returns: string }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "guardian"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student", "guardian"],
    },
  },
} as const
