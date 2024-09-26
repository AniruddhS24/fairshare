"use client";

import { useState } from 'react';
import Text from '../components/Text';
import Input from '../components/TextInput';
import Spacer from '../components/Spacer';
import StickyButton from '../components/StickyButton';
import Image from 'next/image';

export default function Home() {
  const [inputValue, setInputValue] = useState<string>('');

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-5">
      <Image src="/logo.png" alt="Logo" width={250} height={100}/>
      <Spacer size="large" />
      <Text type="m_heading">Heading</Text>
      <Text type="body">Some description text</Text>
      <Spacer size="medium" />
      <Input value={inputValue} setValue={setInputValue} />
      <Spacer size="medium" />
      <StickyButton label="Action" onClick={() => console.log('Submitted')}/>
    </div>
  );
}
