"use client";

import { useState } from 'react';
import Text from '../../components/Text';
import TextInput from '../../components/TextInput';
import PhoneInput from '../../components/PhoneInput';
import StickyButton from '../../components/StickyButton'
import Image from 'next/image';
import Spacer from '@/components/Spacer';


export default function ConsumerOnboardingPage() {
  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  return (
    <div className="h-full flex flex-col items-center justify-start bg-white px-5">
      <Spacer size="large" />
      <Image src="/logo.png" alt="Logo" width={250} height={100}/>
      <Spacer size="large" />
      <Text type="m_heading" className="text-darkest">Consumer Information</Text>
      <Text type="body" className="text-center text-midgray">Please enter your name and phone number to get started</Text>
      <Spacer size="large" />
      <TextInput placeholder="Name" value={name} setValue={setName} />
      <Spacer size="medium" />
      <PhoneInput placeholder="Phone number" value={phoneNumber} setValue={setPhoneNumber} />
      <Spacer size="large" />
      <StickyButton label="Next" onClick={() => console.log('Submitted')}/>
    </div>
  );
};