import { expect, Page, test } from '@playwright/test';

// Contra un servidor externo no se crean datos, salvo que se pida explícitamente
// (p. ej. un servidor de prueba sin base de datos).
const isRemote = Boolean(process.env.PLAYWRIGHT_BASE_URL) && process.env.E2E_ALLOW_WRITES !== 'true';

/**
 * Entra a la agenda.
 * - Instancia demo (DEMO_MODE=true, que es como levanta el servidor local de
 *   la suite): no hay pantalla de ingreso, la app abre directo.
 * - Instancia real: usa una cuenta de prueba de Supabase tomada de
 *   E2E_EMAIL / E2E_PASSWORD. Sin esas variables, el test se omite (antes se
 *   usaba una clave fija "admin123" que ya no existe).
 */
async function login(page: Page) {
  await page.goto('/');
  const appShell = page.locator('#tab-calendar-main:visible, #mobile-bottom-nav:visible').first();
  const authEmail = page.getByTestId('auth-email');
  await expect(appShell.or(authEmail)).toBeVisible({ timeout: 20_000 });

  if (await authEmail.isVisible()) {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    test.skip(!email || !password, 'Instancia con login: definir E2E_EMAIL y E2E_PASSWORD (cuenta de prueba de Supabase).');
    await authEmail.fill(email!);
    await page.getByTestId('auth-password').fill(password!);
    await page.getByTestId('auth-submit').click();
    await expect(authEmail).toBeHidden({ timeout: 15_000 });
  }
  await expect(appShell).toBeVisible();
}

async function createPatient(page: Page, name: string) {
  await page.locator('#tab-contacts-main').or(page.getByRole('button', { name: 'Pacientes' })).first().click();
  await page.getByTestId('btn-new-patient').or(page.getByRole('button', { name: /Nuevo Paciente/ })).first().click();
  const modal = page.locator('#modal-contact-form');
  await expect(modal).toBeVisible();
  await page.getByTestId('contact-fullname').or(page.getByPlaceholder(/Martín González/i)).fill(name);
  // Teléfono único por corrida: la app avisa si el teléfono ya existe (duplicados).
  await page.getByTestId('contact-phone').or(page.getByPlaceholder(/5491145892020/)).fill(`341${String(Date.now()).slice(-7)}`);
  await modal.getByRole('button', { name: /Registrar Contacto/ }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByText(`Nuevo contacto "${name}" registrado`)).toBeVisible();
}

test.describe('Flujos críticos de consultorio', () => {
  test('navega el calendario: mes, lista y hoy', async ({ page }) => {
    await login(page);

    await page.locator('#tab-calendar-main').or(page.getByRole('button', { name: 'Turnos y Agenda' })).click();
    await expect(page.getByTestId('calendar-view-month').or(page.getByRole('button', { name: 'Vista Mes' }))).toBeVisible();
    await expect(page.getByText('HOY', { exact: false }).first()).toBeVisible();

    await page.getByTestId('calendar-view-list').or(page.getByRole('button', { name: 'Lista de Turnos' })).click();
    await expect(page.getByText('Lista Cronológica de Turnos')).toBeVisible();

    await page.getByTestId('calendar-view-month').or(page.getByRole('button', { name: 'Vista Mes' })).click();
    await page.getByTestId('calendar-today').or(page.getByRole('button', { name: 'Hoy' }).first()).click();
    await expect(page.getByText('HOY', { exact: false }).first()).toBeVisible();
  });

  test('alta completa de un turno: paciente, formulario y guardar', async ({ page }) => {
    test.skip(isRemote, 'No crear pacientes de prueba en el deploy público');

    // El nombre solo admite letras: sufijo único con letras en vez de dígitos.
    const uniqueLetters = String(Date.now()).slice(-6).replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);
    const patientName = `Paciente Prueba ${uniqueLetters}`;
    await login(page);
    await createPatient(page, patientName);

    await page.locator('#tab-calendar-main').click();
    await expect(page.getByTestId('calendar-view-month')).toBeVisible();

    const addToday = page.getByTestId('btn-add-turno-today');
    await expect(addToday).toBeVisible();
    await addToday.click();

    await expect(page.locator('#modal-schedule-appointment')).toBeVisible();
    await page.locator('#select-appointment-patient-autocomplete').click();
    await page.locator('#select-appointment-patient-autocomplete').fill(patientName);
    await page.getByRole('option', { name: new RegExp(patientName) }).click();

    await page.getByTestId('dentist-marie').click();
    await page.getByTestId('treatment-consulta').click();
    await expect(page.getByTestId('appt-date')).not.toHaveValue('');

    await page.getByTestId('appt-save').click();
    const scheduleAnyway = page.getByRole('button', { name: 'Agendar de todos modos' });
    await scheduleAnyway.waitFor({ state: 'visible', timeout: 2500 }).then(async () => {
      await scheduleAnyway.click();
    }).catch(() => undefined);
    await expect(page.locator('#modal-schedule-appointment')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(/Nuevo turno agendado/i)).toBeVisible();

    await page.getByTestId('calendar-view-list').click();
    await expect(page.getByText(patientName).first()).toBeVisible();

    await page.reload();
    await page.locator('#tab-calendar-main').click();
    await page.getByTestId('calendar-view-list').click();
    await expect(page.getByText(patientName).first()).toBeVisible();
  });

  test('abre el módulo de finanzas y muestra liquidación', async ({ page }) => {
    await login(page);
    await page.locator('#btn-open-finances').or(page.getByRole('button', { name: /Finanzas/ }).first()).click();
    await expect(page.getByRole('heading', { name: /Finanzas y Liquidación/ })).toBeVisible();
  });
});

test.describe('Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login y navegación inferior en mobile', async ({ page }) => {
    await login(page);
    await expect(page.locator('#mobile-bottom-nav')).toBeVisible();
    await page.locator('#btn-mobile-nav-calendar').click();
    await expect(page.getByText('HOY', { exact: false }).first()).toBeVisible();
    await page.locator('#btn-mobile-nav-finances').click();
    await expect(page.getByText('Finanzas y Liquidación de Honorarios')).toBeVisible();
  });
});
