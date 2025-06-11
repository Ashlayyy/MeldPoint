// project imports
import mock from '../mockAdapter';

// const forms = [
//     {
//     "id": 1,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout. Geen idee, maar het ging goed fout. Geen idee, maar het ging goed fout. Geen idee, maar het ging goed fout. Geen idee, maar het ging goed fout. Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "Opgeleverd",
//     },
//   "preventief": {
//     }
    
//   },
//     {
//     "id": 2,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "complete": false,
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "Toegewezen",
//     },
//     "preventief": {
//     }
//   },
//     {
//       "id": 3,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "complete": false,
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "Afgerond",
//     },
//     "preventief": {
//     }
//   },
//     {
//       "id": 4,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "complete": false,
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "In behandeling",
//     },
//     "preventief": {
//     }
//   },
//     {
//       "id": 5,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "complete": false,
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "Afgerond",
//     },
//     "preventief": {
//     }
//   },
//     {
//       "id": 6,
//     "project": 2022000101,
//     "deelorder": 1,
//     "projectLeader": "Thomas",
//     "obstacleDescription": "Geen idee, maar het ging goed fout.",
//     "correctief": {
//       "complete": false,
//       "solution": "Dat gaan we nog meemaken",
//       "faalkosten": 800,
//       "date": "2024-03-15T10:07:07.116Z",
//       "actiehouder": "Christiaan Slippens",
//       "status": "Afgerond",
//     },
//     "preventief": {
//     }
//   },
// ]
const forms = [{}]

// ==============================|| MOCK SERVICES ||============================== //

mock.onGet('/api/forms/list').reply(() => {
  return [200, forms];
});
mock.onPost('/api/forms/modify').reply((config) => {
  try {
    const user = JSON.parse(config.data);
    if (user.id) {
      const index = forms.findIndex((u) => u.id === user.id);
      if (index > -1) {
        forms[index] = { ...forms[index], ...user };
      }
    } else {
      forms.push({ ...user, id: forms.length + 1 });
    }
    return [200, forms];
  } catch (err) {
    return [500, { message: 'Internal server error' }];
  }
});

mock.onPost('/api/forms/add').reply((config) => {
  try {
    const user = JSON.parse(config.data);
    if (!user.id) {
      forms.push({ ...user, id: forms.length + 1 });
    }
    return [200, forms];
  } catch (err) {
    console.error(err);
    return [500, { message: 'Internal server error' }];
  }
});

export default forms;
