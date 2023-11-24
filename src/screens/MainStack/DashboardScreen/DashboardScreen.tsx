import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FlatList} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {AppButton, ScreenDefaultContainer} from '../../../components/atoms';
import type {MainStackParamList} from '../../../navigation/navigators';
import {BLEService} from '../../../services';
import {BleDevice} from '../../../components/molecules';
import {cloneDeep} from '../../../utils/cloneDeep';

type DashboardScreenProps = NativeStackScreenProps<
  MainStackParamList,
  'DASHBOARD_SCREEN'
>;
type DeviceExtendedByUpdateTime = Device & {updateTimestamp: number};

const MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS = 5000;

export function DashboardScreen({navigation}: DashboardScreenProps) {
  const [foundDevices, setFoundDevices] = useState<
    DeviceExtendedByUpdateTime[]
  >([]);

  const addFoundDevice = (device: Device) =>
    setFoundDevices(prevState => {
      if (!isFoundDeviceUpdateNecessary(prevState, device)) {
        return prevState;
      }
      // deep clone
      const nextState = cloneDeep(prevState);
      const extendedDevice: DeviceExtendedByUpdateTime = {
        ...device,
        updateTimestamp: Date.now() + MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS,
      } as DeviceExtendedByUpdateTime;

      const indexToReplace = nextState.findIndex(
        currentDevice => currentDevice.id === device.id,
      );
      if (indexToReplace === -1) {
        return nextState.concat(extendedDevice);
      }
      nextState[indexToReplace] = extendedDevice;
      return nextState;
    });

  const isFoundDeviceUpdateNecessary = (
    currentDevices: DeviceExtendedByUpdateTime[],
    updatedDevice: Device,
  ) => {
    const currentDevice = currentDevices.find(
      ({id}) => updatedDevice.id === id,
    );
    if (!currentDevice) {
      return true;
    }
    return currentDevice.updateTimestamp < Date.now();
  };

  const deviceRender = (device: Device) => (
    <BleDevice onPress={() => {}} key={device.id} device={device} />
  );

  return (
    <ScreenDefaultContainer>
      <AppButton
        label="Go to nRF test"
        onPress={() => navigation.navigate('DEVICE_NRF_TEST_SCREEN')}
      />
      <AppButton
        label="Look for devices"
        onPress={() => {
          setFoundDevices([]);
          BLEService.initializeBLE().then(() =>
            BLEService.scanDevices(addFoundDevice, null, true),
          );
        }}
      />
      <AppButton
        label="Look for devices (legacy off)"
        onPress={() => {
          setFoundDevices([]);
          BLEService.initializeBLE().then(() =>
            BLEService.scanDevices(addFoundDevice, null, false),
          );
        }}
      />
      <AppButton
        label="Ask for permissions"
        onPress={BLEService.requestBluetoothPermission}
      />
      <FlatList
        style={{flex: 1}}
        data={foundDevices}
        renderItem={({item}) => deviceRender(item)}
        keyExtractor={device => device.id}
      />
    </ScreenDefaultContainer>
  );
}
