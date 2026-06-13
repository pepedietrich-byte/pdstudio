// Agent job status constants — used across all A1-A6 panels and Lead Detail

export const JOB_STATUS = {
  NOT_STARTED:        'not_started',
  RUNNING:            'running',
  DONE:               'done',
  ERROR:              'error',
  NEEDS_CONNECTION:   'needs_connection',
  NOT_CONFIGURED:     'not_configured',
  MANUAL_REQUIRED:    'manual_required',
  NEEDS_REMAP:        'needs_remap',
}

export const JOB_STATUS_LABEL = {
  not_started:      'Nicht gestartet',
  running:          'Läuft...',
  done:             'Fertig',
  error:            'Fehler',
  needs_connection: 'Verbindung fehlt',
  not_configured:   'Nicht konfiguriert',
  manual_required:  'Manuell erforderlich',
  needs_remap:      'Webhook-Mapping ausstehend',
}

export const JOB_STATUS_COLOR = {
  not_started:      'rgba(255,255,255,0.2)',
  running:          '#00d4ff',
  done:             '#2ddb72',
  error:            '#ff3b3b',
  needs_connection: '#f5a623',
  not_configured:   '#f5a623',
  manual_required:  '#9b6ef3',
  needs_remap:      '#f5a623',
}

// Archive reasons
export const ARCHIVE_REASON = {
  LOW_SCORE:    'low_score',
  DUPLICATE:    'duplicate',
  NOT_RELEVANT: 'not_relevant',
  CONVERTED:    'converted',
  REJECTED:     'rejected',
}

// Lead score thresholds
export const SCORE_THRESHOLD = {
  ACTIVE: 50,    // leads below this are archived from active view
  GOOD:   60,
  HOT:    75,
}
