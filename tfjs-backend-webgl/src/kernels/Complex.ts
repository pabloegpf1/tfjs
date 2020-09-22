/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {Complex, ComplexInputs, KernelConfig, KernelFunc, TensorInfo, TypedArray} from '@tensorflow/tfjs-core';

import {MathBackendWebGL} from '../backend_webgl';

export function complex(
    args: {inputs: ComplexInputs, backend: MathBackendWebGL}): TensorInfo {
  const {inputs, backend} = args;
  const {real, imag} = inputs;

  // TODO(annxingyuan): Share data buckets once soft disposal through engine is
  // possible
  const realVals = backend.readSync(real.dataId) as TypedArray;
  const imagVals = backend.readSync(imag.dataId) as TypedArray;

  const complexInfo = backend.makeTensorInfo(real.shape, 'complex64');
  const complex = backend.texData.get(complexInfo.dataId);

  const realDataId = backend.write(realVals, real.shape, 'float32');
  const realTensorInfo:
      TensorInfo = {dataId: realDataId, shape: real.shape, dtype: 'float32'};

  const imagDataId = backend.write(imagVals, imag.shape, 'float32');
  const imagTensorInfo:
      TensorInfo = {dataId: imagDataId, shape: imag.shape, dtype: 'float32'};

  // The complex tensor owns the underlying real and imag tensorInfos, only the
  // complex tensor tracks refCount, when complexData is disposed the
  // underlying tensorData will be disposed.
  complex.complexTensorInfos = {real: realTensorInfo, imag: imagTensorInfo};

  return complexInfo;
}

export const complexConfig: KernelConfig = {
  kernelName: Complex,
  backendName: 'webgl',
  kernelFunc: complex as {} as KernelFunc
};