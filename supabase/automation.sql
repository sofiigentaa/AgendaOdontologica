-- Automatización de la agenda en Supabase.
-- Pegá TODO este script en: Supabase → SQL Editor → Run.
--
-- Hace tres cosas sobre los datos que YA están cargados:
-- 1) Los gastos de un turno nunca pueden superar lo cobrado.
-- 2) La odontóloga queda normalizada: Yani, Marie o Ambas (Las dos).
-- 3) Si no hay turnos de Marie o de Las dos, los crea con pacientes existentes.

alter table public.appointments add column if not exists dentist text;
alter table public.appointments add column if not exists title text;
alter table public.appointments add column if not exists contact_id text;
alter table public.appointments add column if not exists date text;
alter table public.appointments add column if not exists time text;
alter table public.appointments add column if not exists duration integer default 30;
alter table public.appointments add column if not exists duration_minutes integer default 30;
alter table public.appointments add column if not exists motive text;
alter table public.appointments add column if not exists treatment text;
alter table public.appointments add column if not exists completed boolean default false;
alter table public.appointments add column if not exists ingresos double precision default 0;
alter table public.appointments add column if not exists descartables double precision default 0;
alter table public.appointments add column if not exists estampillas double precision default 0;
alter table public.appointments add column if not exists materiales double precision default 0;
alter table public.appointments add column if not exists mecanico_dental double precision default 0;
alter table public.appointments add column if not exists porcentaje_honorario double precision default 50;
alter table public.appointments add column if not exists created_at timestamptz default now();

create or replace function public.agenda_normalize_dentist(raw text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(raw, '')) ~ '(ambas|las dos|marie y yani|yani y marie)' then 'Ambas'
    when lower(coalesce(raw, '')) like '%marie%' then 'Marie'
    when lower(coalesce(raw, '')) like '%yani%' then 'Yani'
    else 'Yani'
  end
$$;

create or replace function public.agenda_clamp_appointment()
returns trigger
language plpgsql
as $$
declare
  cobrado numeric;
  total numeric;
  factor numeric;
  d numeric;
  e numeric;
  m numeric;
  mec numeric;
  dentist_raw text;
begin
  dentist_raw := coalesce(NEW.dentist, NEW.title);
  NEW.dentist := public.agenda_normalize_dentist(dentist_raw);
  NEW.title := NEW.dentist;

  cobrado := round(greatest(coalesce(NEW.ingresos, 0), 0)::numeric, 2);
  NEW.ingresos := cobrado;

  d := round(greatest(coalesce(NEW.descartables, 0), 0)::numeric, 2);
  e := round(greatest(coalesce(NEW.estampillas, 0), 0)::numeric, 2);
  m := round(greatest(coalesce(NEW.materiales, 0), 0)::numeric, 2);
  mec := round(greatest(coalesce(NEW.mecanico_dental, 0), 0)::numeric, 2);
  total := d + e + m + mec;

  if total > cobrado then
    if cobrado <= 0 then
      d := 0; e := 0; m := 0; mec := 0;
    else
      factor := cobrado / total;
      d := round(d * factor, 2);
      e := round(e * factor, 2);
      m := round(m * factor, 2);
      mec := round(mec * factor, 2);
      mec := round(cobrado - (d + e + m), 2);
      if mec < 0 then
        d := round(d + mec, 2);
        mec := 0;
      end if;
    end if;
  end if;

  NEW.descartables := d;
  NEW.estampillas := e;
  NEW.materiales := m;
  NEW.mecanico_dental := mec;

  return NEW;
end;
$$;

drop trigger if exists trg_agenda_clamp_appointment on public.appointments;
create trigger trg_agenda_clamp_appointment
before insert or update on public.appointments
for each row
execute function public.agenda_clamp_appointment();

-- Recorre los turnos ya cargados y aplica el tope de gastos + odontóloga.
update public.appointments
set ingresos = coalesce(ingresos, 0);

create or replace function public.ensure_marie_ambas_turnos()
returns void
language plpgsql
as $$
declare
  c1 public.contacts%rowtype;
  c2 public.contacts%rowtype;
  today_ar text := to_char((now() at time zone 'America/Argentina/Buenos_Aires'), 'YYYY-MM-DD');
begin
  select * into c1 from public.contacts order by created_at nulls last limit 1;
  if c1.id is null then
    return;
  end if;

  select * into c2 from public.contacts order by created_at nulls last offset 1 limit 1;
  if c2.id is null then
    c2 := c1;
  end if;

  if not exists (
    select 1
    from public.appointments a
    where public.agenda_normalize_dentist(coalesce(a.dentist, a.title)) = 'Marie'
  ) then
    insert into public.appointments (
      id, contact_id, date, time, duration, duration_minutes,
      dentist, title, motive, treatment, completed,
      ingresos, descartables, estampillas, materiales, mecanico_dental,
      porcentaje_honorario, created_at
    ) values (
      'appt-seed-marie', c1.id, today_ar, '07:00', 30, 30,
      'Marie', 'Marie', 'Consulta Marie', 'Consulta Marie', false,
      0, 0, 0, 0, 0,
      100, now()
    )
    on conflict (id) do update
      set dentist = 'Marie',
          title = 'Marie',
          date = excluded.date,
          time = excluded.time;
  end if;

  if not exists (
    select 1
    from public.appointments a
    where public.agenda_normalize_dentist(coalesce(a.dentist, a.title)) = 'Ambas'
  ) then
    insert into public.appointments (
      id, contact_id, date, time, duration, duration_minutes,
      dentist, title, motive, treatment, completed,
      ingresos, descartables, estampillas, materiales, mecanico_dental,
      porcentaje_honorario, created_at
    ) values (
      'appt-seed-ambas', c2.id, today_ar, '07:30', 30, 30,
      'Ambas', 'Ambas', 'Consulta las dos', 'Consulta las dos', false,
      0, 0, 0, 0, 0,
      50, now()
    )
    on conflict (id) do update
      set dentist = 'Ambas',
          title = 'Ambas',
          date = excluded.date,
          time = excluded.time;
  end if;
end;
$$;

select public.ensure_marie_ambas_turnos();
