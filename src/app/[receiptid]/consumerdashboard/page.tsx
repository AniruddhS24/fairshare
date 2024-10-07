"use client";

import { useState, useEffect } from 'react';
import Text from '@/components/Text';
import SquareButton from '@/components/SquareButton';
import Image from 'next/image';
import Spacer from '@/components/Spacer';
import ModifyButton from '@/components/ModifyButton';
import StickyButton from '@/components/StickyButton';
import { useRouter } from 'next/navigation';
import SegmentedToggle from '@/components/Toggle';
import { fetchDummyData } from '../../lib/backend';
import LineItem from '@/components/LineItem';
import ConsumerBreakdown from '@/components/ConsumerBreakdown';
import ItemBreakdown from '@/components/ItemBreakdown';

export default function ConsumerDashboard({ params }: { params: { receiptid: string } }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [receiptItems, setReceiptItems] = useState([]);
  const [isReminderPopupVisible, setIsReminderPopupVisible] = useState(false);
  const [reminderName, setReminderName] = useState("");

  const router = useRouter();

  useEffect(() => {
    setReceiptItems(fetchDummyData());
  }
  , []);

  const markSettled = () => {
    alert("TODO");
  };

  const handleReminder = (name) => {
    setIsReminderPopupVisible(true);
    setReminderName(name);
  }

  return (
    <div className="h-screen w-full">
      {isReminderPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-[#1C2B35] opacity-20"></div> {/* Blurred Background */}
          <div className="relative z-10 bg-white p-7 rounded-lg shadow-lg w-64 text-center">
            <p className="text-primary text-lg font-bold">Send Reminder</p>
            <p className="text-darkest text-base font-normal">Do you want to send {reminderName} a reminder to send your payment?</p>
            <div className="mt-5 flex justify-center space-x-4">
              <button 
                className="flex-1 px-4 py-2 bg-white text-midgray font-bold border rounded-full" 
                onClick={() => setIsReminderPopupVisible(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-full" 
                onClick={() => setIsReminderPopupVisible(false)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-full flex flex-col items-start justify-start bg-white px-5 pb-12">
      <Spacer size="large" />
      <Text type="xl_heading">Payment Breakdown</Text>
      <Spacer size="medium" />
      <SegmentedToggle tab1label="My Items" tab1icon="fa-utensils" tab2label="People" tab2icon="fa-users" selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <Spacer size="large" />
      {selectedTab === 0 ? (
        <div className="w-full">
            <div className="w-full mb-4">
                <ItemBreakdown name="2 Fish & Chips Bowl" quantity={1} price={10.00} consumers={['Ishita']} />
            </div>
            <LineItem label="Shared Charges" price={0} labelColor='text-midgray' bold />
            <Spacer size="medium" />
            <LineItem label="Grand Total" price={0} labelColor='text-primary' bold />
            <StickyButton label="Pay @Aniruddh-Sriram" onClick={markSettled} sticky/>
        </div>   
        
    ) : (
            <div className="w-full">
                <div className="w-full mb-4">
                    <ConsumerBreakdown consumer="John Doe" items={[{ item: 'Item 1', quantity: 2, split: 3, price: 10 }, { item: 'Item 2', quantity: 1, split: 2, price: 20 }]} sharedCost={10} isHost/>
                </div>
                <div className="w-full mb-4">
                    <ConsumerBreakdown consumer="manas dhal" items={[{ item: 'Item 1', quantity: 2, split: 3, price: 10 }, { item: 'Item 2', quantity: 1, split: 2, price: 20 }]} sharedCost={10} />
                </div>
                <StickyButton label="Pay @Aniruddh-Sriram" onClick={markSettled} sticky/>
            </div>
        )
            }
      </div>
    </div>
    );
}
