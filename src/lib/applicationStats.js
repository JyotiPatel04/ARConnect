// Pure aggregation over an already-loaded applications array (see
// useMyApplications) -- no Firestore reads of its own. Uses the exact
// existing status vocabulary (APPLICATION_STATUSES in
// employerApplicationService.js: applied/reviewing/shortlisted/interview/
// rejected/hired, plus candidate-set 'withdrawn') -- no new statuses.
//
// 'interview' here means application.status === 'interview' (the pipeline
// stage on the application document itself) -- NOT a count of documents in
// the separate interviews collection, which can legitimately differ (an
// employer may not have scheduled an actual interview yet, or one may
// already be completed while the application's status field still reads
// 'interview'). See upcomingInterviews.js for the interviews collection.
export function computeApplicationStats(applications) {
  const stats = { total: applications.length, active: 0, interviews: 0, selected: 0 }

  for (const application of applications) {
    if (application.status === 'applied' || application.status === 'reviewing' || application.status === 'shortlisted') {
      stats.active += 1
    } else if (application.status === 'interview') {
      stats.interviews += 1
    } else if (application.status === 'hired') {
      stats.selected += 1
    }
  }

  return stats
}
