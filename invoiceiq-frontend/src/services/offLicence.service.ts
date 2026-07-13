import api, { clientUrl } from '../lib/axios'

// ── Alcohol Duty ──────────────────────────────────────────────────────────────
export const alcoholDutyService = {
  getPeriods: () =>
    api.get(clientUrl('/alcohol-duty')).then(r => r.data),

  calculate: (body: { periodFrom: string; periodTo: string; quarterLabel?: string }) =>
    api.post(clientUrl('/alcohol-duty/calculate'), body).then(r => r.data),

  getPeriod: (periodId: string) =>
    api.get(clientUrl(`/alcohol-duty/${periodId}`)).then(r => r.data),

  submit: (periodId: string) =>
    api.post(clientUrl(`/alcohol-duty/${periodId}/submit`)).then(r => r.data),

  getRates: () =>
    api.get('/api/alcohol-duty-rates').then(r => r.data),
}

// ── VAT Returns ───────────────────────────────────────────────────────────────
export const vatReturnService = {
  getAll: () =>
    api.get(clientUrl('/vat-returns')).then(r => r.data),

  create: (body: object) =>
    api.post(clientUrl('/vat-returns'), body).then(r => r.data),

  get: (returnId: string) =>
    api.get(clientUrl(`/vat-returns/${returnId}`)).then(r => r.data),

  update: (returnId: string, body: object) =>
    api.put(clientUrl(`/vat-returns/${returnId}`), body).then(r => r.data),

  submit: (returnId: string) =>
    api.post(clientUrl(`/vat-returns/${returnId}/submit`)).then(r => r.data),
}

// ── Management Accounts ───────────────────────────────────────────────────────
export const managementAccountService = {
  getAll: (year?: number) =>
    api.get(clientUrl('/management-accounts'), { params: { year } }).then(r => r.data),

  create: (body: object) =>
    api.post(clientUrl('/management-accounts'), body).then(r => r.data),

  get: (maId: string) =>
    api.get(clientUrl(`/management-accounts/${maId}`)).then(r => r.data),

  update: (maId: string, body: object) =>
    api.put(clientUrl(`/management-accounts/${maId}`), body).then(r => r.data),

  sendToClient: (maId: string) =>
    api.post(clientUrl(`/management-accounts/${maId}/send`)).then(r => r.data),
}
