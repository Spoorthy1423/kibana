/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../../api_integration/ftr_provider_context';
import { skipIfNoDockerRegistry } from '../../helpers';
import { SpaceTestApiClient } from './api_helper';
import { cleanFleetIndices, createFleetAgent } from './helpers';
import { setupTestSpaces, TEST_SPACE_1 } from './space_helpers';

export default function (providerContext: FtrProviderContext) {
  const { getService } = providerContext;
  const supertest = getService('supertest');
  const esClient = getService('es');
  const kibanaServer = getService('kibanaServer');

  describe('enrollment_settings', async function () {
    skipIfNoDockerRegistry(providerContext);
    const apiClient = new SpaceTestApiClient(supertest);

    describe('Without Fleet server setup', () => {
      before(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      after(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      setupTestSpaces(providerContext);

      before(async () => {
        await apiClient.postEnableSpaceAwareness();
        await apiClient.setup();
      });

      describe('GET /enrollments/settings', () => {
        it('in default space it should not return an active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings();
          expect(res.fleet_server.has_active).to.be(false);
        });

        it('in a specific spaceit should not return an active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings(TEST_SPACE_1);
          expect(res.fleet_server.has_active).to.be(false);
        });
      });
    });

    describe('With Fleet server setup in a specific space', () => {
      before(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      after(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      setupTestSpaces(providerContext);

      before(async () => {
        await apiClient.postEnableSpaceAwareness();
        await apiClient.setup();
        const testSpaceFleetServerPolicy = await apiClient.createFleetServerPolicy(TEST_SPACE_1);
        await createFleetAgent(esClient, testSpaceFleetServerPolicy.item.id, TEST_SPACE_1);
      });

      describe('GET /enrollments/settings', () => {
        it('in default space it should return all policies and active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings();
          expect(res.fleet_server.has_active).to.be(true);
        });

        it('in a specific  space it should return all policies and active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings(TEST_SPACE_1);
          expect(res.fleet_server.has_active).to.be(true);
        });
      });
    });

    describe('With Fleet server setup in default space', () => {
      before(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      after(async () => {
        await kibanaServer.savedObjects.cleanStandardList();
        await kibanaServer.savedObjects.cleanStandardList({
          space: TEST_SPACE_1,
        });
        await cleanFleetIndices(esClient);
      });

      setupTestSpaces(providerContext);

      before(async () => {
        await apiClient.postEnableSpaceAwareness();
        await apiClient.setup();
        const defaultFleetServerPolicy = await apiClient.createFleetServerPolicy();
        await createFleetAgent(esClient, defaultFleetServerPolicy.item.id);
      });

      describe('GET /enrollments/settings', () => {
        it('in default space it should return all policies and active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings();
          expect(res.fleet_server.has_active).to.be(true);
        });

        it('in a specific  space it should return all policies and active fleet server', async () => {
          const res = await apiClient.getEnrollmentSettings(TEST_SPACE_1);
          expect(res.fleet_server.has_active).to.be(true);
        });
      });
    });
  });
}
