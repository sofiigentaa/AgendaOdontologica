import { expect, Page, test } from '@playwright/test';

const isRemote = Boolean(process.env.PLAYWRIGHT_BASE_URL);

async function login(page: Page) {
  await page.goto('/');
  const email = page.getByTestId('auth-email').or(page.getByPlaceholder(/odontologo@/i));
  const password = page.getByTestId('auth-password').or(page.getByPlaceholder('••••••••'));
  await expect(email).toBeVisible();
  await email.fill('e2e@consultorio.test');
  await password.fill('admin123');
  await page.getByTestId('auth-submit').or(page.getByRole('button', { name: 'Ingresar' })).click();
  await expect(page.getByTestId('auth-email').or(page.getByPlaceholder(/odontologo@/i))).toBeHidden({ timeout: 10_000 });
}

async function createPatient(page: Page, name: string) {
  await page.locator('#tab-contacts-main').or(page.getByRole('button', { name: 'Pacientes' })).first().click();
  await page.getByTestId('btn-new-patient').or(page.getByRole('button', { name: /Nuevo Paciente/ })).first().click();
  const modal = page.locator('#modal-contact-form');
  await expect(modal).toBeVisible();
  await page.getByTestId('contact-fullname').or(page.getByPlaceholder(/Martín González/i)).fill(name);
  await page.getByTestId('contact-phone').or(page.getByPlaceholder(/5491145892020/)).fill('3415550199');
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

    const patientName = `Paciente E2E ${Date.now()}`;
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
