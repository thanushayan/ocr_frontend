# OcrInvoiceSaaS — Backend API Inventory

Extracted from the ASP.NET backend (`OcrInvoiceSaaS`). Base URL: `http://localhost:5206`
(CORS allows `http://localhost:3000` — run the frontend on port 3000).
All JSON is camelCase. Auth: `Authorization: Bearer <JWT>`.

## Auth — `api/auth`
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ fullName, email, password, phone? }` → AuthResponse `{ token, refreshToken?, accountantId, fullName, email, expiresAt, plan? }` |
| POST | `/api/auth/login` | `{ email, password }` → AuthResponse |
| POST | `/api/auth/refresh` | `{ refreshToken }` → AuthResponse |
| GET | `/api/auth/me` | → AccountantProfileResponse (incl. plan, subscriptionStatus, totalClients, maxClients) |
| PUT | `/api/auth/me` | `{ fullName?, phone?, practiceAddress?, practicePostcode?, icaewNumber?, aatNumber?, mtdAgentReference?, vatAgentCode? }` |
| POST | `/api/auth/forgot-password` | `{ email }` |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` |

No logout/revoke endpoint — logout is client-side only.

## Two-factor — `api/auth/2fa`
POST `send-enable-code` · POST `enable` `{code}` · POST `send-disable-code` · POST `disable` `{code}` · POST `verify` `{ accountantId, code }` · GET `status`

## Accountant — `api/accountant`
GET/PUT `profile` · GET `dashboard` (totals: clients, tasks, alerts, draft VAT, invoicesThisMonth, monthlyRecurringFees, recentAlerts) · GET `compliance-alerts` · GET `subscription`

## Clients — `api/clients`
| Method | Path |
|---|---|
| GET/POST | `/api/clients` |
| GET/PUT/DELETE | `/api/clients/{clientId}` |
| GET | `/api/clients/{clientId}/summary`, `/dashboard`, `/alerts` |
| GET/PUT | `/api/clients/{clientId}/premises-licence`, `/awrs` |
| GET/POST | `/api/clients/{clientId}/notes` (`{ noteText, noteType?, isPinned? }`) |
| GET/POST | `/api/clients/{clientId}/tasks` (`{ title, description?, priority?, dueDate? }`) · PATCH `/tasks/{taskId}` (`{ status?, priority?, … }`) |
| GET/POST | `/api/clients/{clientId}/portal-users` (invite: `{ fullName, email, password, canUploadDocuments?, canViewReports?, canViewInvoices? }`) |

## Invoices — `api/clients/{clientId}/invoices`
GET `` (page, pageSize, search, status, sortBy, sortDir, vendorId → `{ items, totalCount, page, pageSize, totalPages }`) · POST `` · GET/PATCH `{invoiceId}` · POST `check-duplicate`

## Upload — `api/clients/{clientId}/upload`
POST `` (multipart `file`, `vendorId?`, `expenseCategoryId?`, `notes?` → `{ invoice, file }`) · POST `file-only`

## OCR
POST `/api/invoices/{invoiceId}/ocr` → `{ invoiceId, invoiceNumber?, invoiceDate?, totalAmount?, taxAmount?, currency?, vendorName?, provider, success }`
(No confidence/corrections endpoints — field corrections are done via invoice PATCH.)

## Bulk OCR — `api/clients/{clientId}/bulk-ocr`
POST `` `{ invoiceIds }` · GET `` · GET `{jobId}` · POST `{jobId}/cancel`

## Invoice comments — `api/invoices/{invoiceId}/comments`
POST `` `{ content, mentionedUserIds? }` · GET `` · PUT/DELETE `{commentId}` · POST `{commentId}/resolve` · GET `/api/clients/{clientId}/comments/unresolved`

## Invoice items
POST `/api/invoices/{invoiceId}/items` · PATCH `/api/items/{itemId}` · DELETE `/api/items/{itemId}`

## Approvals
POST/GET `/api/clients/{clientId}/workflow-templates` · DELETE `/api/workflow-templates/{templateId}` · POST `/api/invoices/{invoiceId}/approval/start` · GET `/api/invoices/{invoiceId}/approval` · GET `/api/approvals/pending` · POST `/api/approvals/{instanceId}/act` · POST `/api/approvals/{instanceId}/cancel`

## Duplicates — `api/clients/{clientId}/duplicates`
POST `check` · GET `` · GET `invoice/{invoiceId}` · POST `{flagId}/review`

## Purchase orders — `api/clients/{clientId}/purchase-orders`
POST/GET `` · GET/PUT/DELETE `{poId}`

## Invoice↔PO matching — `api/clients/{clientId}`
POST `invoices/{invoiceId}/po-match/auto` · POST `…/po-match/manual` · GET `…/po-match` · GET `purchase-orders/{poId}/matches` · POST `po-matches/{matchId}/review`

## Vendors — `api/vendors` (accountant-level)
POST `` `{ name, contactEmail?, phone?, address?, vatNumber? }` · GET ``
(No portal invite / portal-access endpoints.)

## Alcohol duty
GET `/api/clients/{clientId}/alcohol-duty` · POST `…/calculate` `{ periodFrom, periodTo, quarterLabel? }` · GET `…/{periodId}` · POST `…/{periodId}/submit` · GET `/api/alcohol-duty-rates`

## VAT returns — `api/clients/{clientId}/vat-returns`
GET/POST `` (create: `{ periodFrom, periodTo, periodKey?, paymentDueDate?, notes? }`) · GET/PUT `{returnId}` · POST `{returnId}/submit`
Fields: `box1_VatOnSales` … `box9_NetEuAcquisitions`, `status: Draft|ReadyToSubmit|Submitted|…`

## Management accounts — `api/clients/{clientId}/management-accounts`
GET `` (`?year=`) · POST `` · GET/PUT `{maId}` · POST `{maId}/send`
Revenue: alcohol/tobacco/grocery/lotteryCommission/other; costs: per-category COGS + staffWages, rentAndRates, utilitiesCost, insuranceCost, accountancyFee, bankCharges, otherOverheads; taxProvision.

## Currency — `api/clients/{clientId}/currency`
GET/PUT `base` · GET `rates` · POST/GET `invoices/{invoiceId}/convert|` · GET `summary/{year}/{month}`

## Reports — `api/clients/{clientId}/reports`
GET `invoices.csv` · GET `spend-by-vendor.csv` · GET `monthly.csv` · GET `invoices` (CSV text wrapped in JSON) · GET `invoice/{invoiceId}.html`
(No spend-trend/vendor-spend/YoY JSON endpoints — aggregates are computed client-side from the invoice list + dashboard.)

## Data export — `api/clients/{clientId}/export`
`invoices.csv|json`, `vendors.csv`, `purchase-orders.csv`, `audit.json`, `currency-conversions.csv`

## Webhooks — `api/clients/{clientId}/webhooks`
POST/GET `` · GET/PUT/DELETE `{webhookId}` · POST `{webhookId}/test` · GET `{webhookId}/deliveries`

## API keys — `api/api-keys` (accountant-level, NOT client-scoped)
POST `` · GET `` · DELETE `{keyId}`

## Xero — `api/xero`
GET `{clientId}/connect` · GET `callback` · GET `{clientId}/connection` · DELETE `{clientId}/disconnect` · POST `{clientId}/sync`

## Notifications — `api/notifications`
GET `` (`?unreadOnly=`) · POST `mark-read` `{ notificationIds }`

## Audit
GET `/api/audit/{entityType}/{entityId}` · GET `/api/audit/user/{userId}` · GET `/api/audit-logs` · GET `/api/invoices/{invoiceId}/activity` · GET `/api/audit-logs/summary` · GET `/api/audit-logs/export.csv`

## Client portal — `api/portal`
POST `login` `{ email, password }` → `{ token, clientId, portalUserId, fullName, businessName }`

## Health — `api/health`
GET `` · `detailed` · `version` · `readiness`

---
### Endpoints the old frontend called that DO NOT exist (now removed/rewired)
- `/api/auth/logout-all`, `/api/auth/revoke` → logout is local-only
- `/api/invoices/{id}/ocr/confidence|corrections|approve`, client `ocr/confidence-report|confidence-threshold` → corrections via invoice PATCH
- `/api/vendors/{id}/invite`, `/api/vendors/{id}/portal-access` → portal invites are client portal users
- `/api/i18n/clients/{id}/language` → language preference stored locally
- `/api/clients/{id}/api-keys` → `/api/api-keys`
- `/api/clients/{id}/reports/spend-trend|vendor-spend|currency-breakdown|year-over-year|budget-vs-actual` → computed client-side
- `/api/accountant/members` → no team management (solo accountant)
