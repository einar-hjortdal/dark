import { QIcon, Direction } from '@nodegui/nodegui';
import { h, Fragment, component, useState } from '@dark-engine/core';
import {
  type PushButtonSignals,
  Window,
  BoxLayout,
  Text,
  StatusBar,
  Splitter,
  ProgressBar,
  PushButton,
  useStyle,
  useEventSystem,
} from '@dark-engine/platform-desktop';

import nodeguiIcon from '../assets/nodegui.jpg';

type AppProps = {};

const winIcon = new QIcon(nodeguiIcon);

const App = component<AppProps>(() => {
  const [percent, setPercent] = useState(0);
  const style = useStyle(styled => ({
    root: styled`
      #text-1 {
        background-color: 'pink';
      }
      #text-2 {
        background-color: 'yellow';
      }
      #text-3 {
        background-color: 'green';
      }
    `,
  }));

  const buttonEvents = useEventSystem<PushButtonSignals>(
    {
      clicked: () => percent < 100 && setPercent(x => x + 5),
    },
    [],
  );

  return (
    <>
      <Window windowTitle='Dark desktop app' windowIcon={winIcon} width={400} height={400} styleSheet={style.root}>
        <StatusBar>
          <Text>Loaded {percent}%</Text>
        </StatusBar>
        <BoxLayout direction={Direction.TopToBottom}>
          <Splitter>
            <Text id='text-1'>Content 1</Text>
            <Text id='text-2'>Content 2</Text>
            <Text id='text-3'>Content 3</Text>
          </Splitter>
          <ProgressBar value={percent} textHidden />
          <PushButton text='increase' on={buttonEvents} />
        </BoxLayout>
      </Window>
    </>
  );
});

export default App;
