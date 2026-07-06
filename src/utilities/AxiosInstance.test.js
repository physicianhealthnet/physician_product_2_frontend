import { describe, it, expect } from 'vitest';
import { AxiosInstance, AxiosInstanceSecondryServer, AxiosInstanceDependency } from './AxiosInstance.js';

describe('Axios Instances', () => {
  it('should export AxiosInstance with correct baseURL', () => {
    expect(AxiosInstance).toBeDefined();
    expect(AxiosInstance.defaults.baseURL).toBe('https://demo.physicianhealthnet.com/api');
  });

  it('should export AxiosInstanceSecondryServer with correct baseURL', () => {
    expect(AxiosInstanceSecondryServer).toBeDefined();
    expect(AxiosInstanceSecondryServer.defaults.baseURL).toBe('https://dependencyforphn.physicianhealthnet.com/api/');
  });

  it('should export AxiosInstanceDependency pointing to SecondryServer', () => {
    expect(AxiosInstanceDependency).toBeDefined();
    expect(AxiosInstanceDependency).toBe(AxiosInstanceSecondryServer);
  });
});
