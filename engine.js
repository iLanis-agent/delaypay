// DelayPay engine - EU261 compensation logic (no DOM)
(function (root) {
  'use strict';

  // Route scope under EC 261/2004:
  // - any flight DEPARTING an EU/EEA/UK airport (any carrier)
  // - flights ARRIVING in the EU/EEA/UK from outside, only if carrier is EU/EEA/UK
  function inScope(opts) {
    if (opts.depEU) return true;
    if (opts.arrEU && opts.carrierEU) return true;
    return false;
  }

  var REASONS = [
    { id: 'technical', label: 'Technical / mechanical issue', extraordinary: false },
    { id: 'crew', label: 'Crew shortage or scheduling', extraordinary: false },
    { id: 'overbook', label: 'Overbooking / denied boarding', extraordinary: false },
    { id: 'lateaircraft', label: 'Knock-on delay from earlier flight', extraordinary: false },
    { id: 'weather', label: 'Severe weather', extraordinary: true },
    { id: 'atc', label: 'Air traffic control restrictions', extraordinary: true },
    { id: 'strike_ext', label: 'Strike by airport / ATC staff (not airline staff)', extraordinary: true },
    { id: 'security', label: 'Security risk / political unrest', extraordinary: true },
    { id: 'birdstrike', label: 'Bird strike / hidden manufacturing defect', extraordinary: true },
    { id: 'unknown', label: 'Not sure / airline gave no reason', extraordinary: false }
  ];

  function reasonById(id) {
    for (var i = 0; i < REASONS.length; i++) if (REASONS[i].id === id) return REASONS[i];
    return null;
  }

  function distanceBand(km) {
    if (!(km > 0)) throw new Error('distance must be positive');
    if (km <= 1500) return { band: 1, base: 250, label: 'up to 1,500 km' };
    if (km <= 3500) return { band: 2, base: 400, label: '1,500 - 3,500 km' };
    return { band: 3, base: 600, label: 'over 3,500 km' };
  }

  // delayMin = arrival delay at final destination.
  function compensation(km, delayMin) {
    var b = distanceBand(km);
    if (delayMin < 180) return { amount: 0, note: 'Under 3 hours - no fixed compensation' };
    // Long-haul (>3,500km) arriving 3-4h late: 50% reduction.
    if (b.band === 3 && delayMin < 240) return { amount: 300, note: '50% of EUR 600 - long-haul arriving 3-4h late' };
    return { amount: b.base, note: 'EUR ' + b.base + ' per passenger (' + b.label + ')' };
  }

  // Full verdict. opts: {depEU, arrEU, carrierEU, km, delayMin, reasonId, cancelled, noticeDays}
  function verdict(opts) {
    if (!inScope(opts)) {
      return { eligible: false, amount: 0, why: 'Out of EU261 scope: the flight neither departed the EU/UK nor arrived on an EU/UK carrier.' };
    }
    var r = reasonById(opts.reasonId);
    if (r && r.extraordinary) {
      return { eligible: false, amount: 0, why: 'Likely "extraordinary circumstances" (' + r.label.toLowerCase() + ') - airlines owe care, but not fixed compensation.' };
    }
    if (opts.cancelled) {
      if (opts.noticeDays != null && opts.noticeDays >= 14) {
        return { eligible: false, amount: 0, why: 'Cancelled with 14+ days notice - refund or rebooking owed, but no fixed compensation.' };
      }
      var c = compensation(opts.km, 181);
      return { eligible: true, amount: c.amount, why: 'Cancellation on short notice. ' + c.note + ' (plus refund or rebooking).' };
    }
    var c2 = compensation(opts.km, opts.delayMin);
    if (c2.amount === 0) return { eligible: false, amount: 0, why: c2.note + '. Keep receipts - meals and hotels may still be owed.' };
    return { eligible: true, amount: c2.amount, why: c2.note };
  }

  function fmtEUR(n) { return 'EUR ' + n; }

  function claimLetter(o) {
    var lines = [];
    lines.push('Subject: EU261 compensation claim - flight ' + o.flightNo + ' on ' + o.date);
    lines.push('');
    lines.push('Dear ' + (o.airline || 'Sir or Madam') + ' Customer Relations,');
    lines.push('');
    lines.push('I am writing to claim compensation under Regulation (EC) No 261/2004 for flight ' + o.flightNo +
      ' from ' + o.from + ' to ' + o.to + ' on ' + o.date + ', booking reference ' + o.bookingRef + '.');
    if (o.cancelled) {
      lines.push('The flight was cancelled ' + (o.noticeDays != null ? o.noticeDays + ' days before departure' : 'on short notice') + '.');
    } else {
      lines.push('The flight arrived at my final destination ' + Math.floor(o.delayMin / 60) + ' hours and ' + (o.delayMin % 60) + ' minutes late.');
    }
    lines.push('The route distance is approximately ' + o.km + ' km. As the disruption was within the airline\'s control, I am entitled to EUR ' + o.amount + ' per passenger under Article 7 of the Regulation.');
    if (o.passengers > 1) lines.push('I travelled with ' + (o.passengers - 1) + ' other passenger(s) on the same booking; total claimed: EUR ' + (o.amount * o.passengers) + '.');
    lines.push('');
    lines.push('Please transfer the compensation within 14 days. I attach my booking confirmation and boarding pass.');
    lines.push('');
    lines.push('Kind regards,');
    lines.push(o.name || '[Your name]');
    return lines.join('\n');
  }

  var api = {
    REASONS: REASONS,
    inScope: inScope,
    reasonById: reasonById,
    distanceBand: distanceBand,
    compensation: compensation,
    verdict: verdict,
    claimLetter: claimLetter
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DelayEngine = api;
})(typeof self !== 'undefined' ? self : this);
