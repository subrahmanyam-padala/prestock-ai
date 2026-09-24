import { AssetsResponse } from '../types';
import { http } from './http';

export const getAssets = (refresh = false) => http<AssetsResponse>(`/api/assets${refresh ? '?refresh=1' : ''}`);
