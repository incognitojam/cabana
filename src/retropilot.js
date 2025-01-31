import Moment from 'moment';
import CorollaDBC from './corolla-dbc';
import DBC from './models/can/dbc';
import { fetchPersistedDbc } from './api/localstorage';

export async function loadRetropilotDrive(retropilotHost, driveIdentifier, seekTime) {
  if (driveIdentifier == null || driveIdentifier.length === 0) {
    global.retropilotLoaded = false;
    return;
  }

  const response = await fetch(retropilotHost + 'useradmin/cabana_drive/' + encodeURIComponent(driveIdentifier));
  let retropilotDrive = '';
  try {
    retropilotDrive = await response.json();
  } catch (exception) {
    console.error(exception);
  }

  if (!retropilotDrive || !retropilotDrive.logUrls) {
    alert(retropilotDrive && retropilotDrive.status ? retropilotDrive.status : 'fetching retropilot drive failed!');
    global.retropilotLoaded = false;
    return;
  }
  global.retropilotLogUrls = retropilotDrive.logUrls;

  const dbcObj = retropilotDrive.dbc && retropilotDrive.dbc.length > 0
    ? new DBC(retropilotDrive.dbc)
    : CorollaDBC;

  global.retropilotProps = {
    autoplay: true,
    startTime: seekTime,
    segments: global.retropilotLogUrls.length,
    isDemo: true,
    max: global.retropilotLogUrls.length,
    name: retropilotDrive.driveIdentifier,
    dongleId: retropilotDrive.dongleId,
    dbc: dbcObj,
    dbcFilename: retropilotDrive.dbcFilename ? retropilotDrive.dbcFilename : 'toyota_nodsu_pt_generated.dbc',
  };

  global.retropilotRoute = {
    fullname: retropilotDrive.name,
    proclog: global.retropilotProps.max,
    start_time: Moment(global.retropilotProps.name, 'YYYY-MM-DD--H-m-s'),
    url: retropilotDrive.driveUrl,
  };

  if (global.retropilotProps.max > 0) {
    const persistedDbc = fetchPersistedDbc(global.retropilotRoute.fullname);
    if (persistedDbc) {
      const { dbcFilename, dbc } = persistedDbc;
      global.retropilotProps.dbc = dbc;
      global.retropilotProps.dbcFilename = dbcFilename;
    }

    global.retropilotLoaded = true;
  } else {
    global.retropilotLoaded = false;
  }
}
