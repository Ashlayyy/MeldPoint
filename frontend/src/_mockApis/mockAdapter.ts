import AxiosMockAdapter from 'axios-mock-adapter';
import axios from '../utils/axios';

const mock = new AxiosMockAdapter(axios, { delayResponse: 2 });
export default mock;
