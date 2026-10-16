import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client, AustralianState, EmploymentType } from '../../types';
import { AU_STATES } from '../../lib/formatters';
import { storage } from '../../services/storage';
import { Modal } from '../../components/ui/Overlays';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const clientSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  preferredName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Valid Australian phone required'),
  dateOfBirth: z.string().min(1, 'Date of birth required (DD/MM/YYYY)'),
  status: z.enum(['Lead', 'Active', 'Settled', 'Archived']),
  street: z.string().min(3, 'Street address required'),
  suburb: z.string().min(2, 'Suburb required'),
  state: z.string().min(2, 'State required'),
  postcode: z.string().min(4, '4-digit postcode required'),
  employmentType: z.string(),
  employer: z.string().min(2, 'Employer required'),
  occupation: z.string().min(2, 'Occupation required'),
  yearsEmployed: z.number().min(0),
  annualIncome: z.number().min(0, 'Income must be >= 0'),
  otherIncome: z.number().min(0),
  monthlyLivingExpenses: z.number().min(0, 'Expenses must be >= 0'),
  totalAssets: z.number().min(0),
  totalLiabilities: z.number().min(0),
  notes: z.string().optional(),
  assignedBrokerId: z.string(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onSave: (clientData: any) => Promise<void>;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const users = storage.getUsers().filter((u) => u.role !== 'assistant');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      email: '',
      phone: '',
      dateOfBirth: '15/06/1985',
      status: 'Lead',
      street: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      employmentType: 'PAYG Permanent',
      employer: '',
      occupation: '',
      yearsEmployed: 3,
      annualIncome: 140000,
      otherIncome: 0,
      monthlyLivingExpenses: 3800,
      totalAssets: 850000,
      totalLiabilities: 450000,
      notes: '',
      assignedBrokerId: users[0]?.id || 'usr-1',
    },
  });

  useEffect(() => {
    if (clientToEdit) {
      reset({
        firstName: clientToEdit.firstName,
        lastName: clientToEdit.lastName,
        preferredName: clientToEdit.preferredName || '',
        email: clientToEdit.email,
        phone: clientToEdit.phone,
        dateOfBirth: clientToEdit.dateOfBirth,
        status: clientToEdit.status,
        street: clientToEdit.address.street,
        suburb: clientToEdit.address.suburb,
        state: clientToEdit.address.state,
        postcode: clientToEdit.address.postcode,
        employmentType: clientToEdit.employment.type,
        employer: clientToEdit.employment.employer,
        occupation: clientToEdit.employment.occupation,
        yearsEmployed: clientToEdit.employment.yearsEmployed,
        annualIncome: clientToEdit.financials.annualIncome,
        otherIncome: clientToEdit.financials.otherIncome,
        monthlyLivingExpenses: clientToEdit.financials.monthlyLivingExpenses,
        totalAssets: clientToEdit.financials.totalAssets,
        totalLiabilities: clientToEdit.financials.totalLiabilities,
        notes: clientToEdit.notes,
        assignedBrokerId: clientToEdit.assignedBrokerId,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        preferredName: '',
        email: '',
        phone: '+61 4',
        dateOfBirth: '12/04/1988',
        status: 'Lead',
        street: '',
        suburb: '',
        state: 'NSW',
        postcode: '',
        employmentType: 'PAYG Permanent',
        employer: '',
        occupation: '',
        yearsEmployed: 2,
        annualIncome: 150000,
        otherIncome: 0,
        monthlyLivingExpenses: 4000,
        totalAssets: 750000,
        totalLiabilities: 350000,
        notes: '',
        assignedBrokerId: users[0]?.id || 'usr-1',
      });
    }
  }, [clientToEdit, reset]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const broker = users.find((u) => u.id === data.assignedBrokerId) || users[0];
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName || undefined,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        status: data.status,
        address: {
          street: data.street,
          suburb: data.suburb,
          state: data.state as AustralianState,
          postcode: data.postcode,
        },
        employment: {
          type: data.employmentType as EmploymentType,
          employer: data.employer,
          occupation: data.occupation,
          yearsEmployed: data.yearsEmployed,
        },
        financials: {
          annualIncome: data.annualIncome,
          otherIncome: data.otherIncome,
          monthlyLivingExpenses: data.monthlyLivingExpenses,
          totalAssets: data.totalAssets,
          totalLiabilities: data.totalLiabilities,
        },
        notes: data.notes || '',
        assignedBrokerId: broker.id,
        assignedBrokerName: broker.name,
      };
      await onSave(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Client Record' : 'Add New Client Profile'}
      description="Enter personal, employment, and HEM-compliant Australian credit financial details."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Details */}
        <div>
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 pb-1 border-b border-teal-100">
            1. Personal & Contact Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              required
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
              required
            />
            <Input
              label="Preferred Name (optional)"
              {...register('preferredName')}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />
            <Input
              label="Phone (+61)"
              {...register('phone')}
              error={errors.phone?.message}
              required
            />
            <Input
              label="Date of Birth (DD/MM/YYYY)"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
              required
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 pb-1 border-b border-teal-100">
            2. Australian Residential Address
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                {...register('street')}
                error={errors.street?.message}
                placeholder="e.g. 42 Ocean Avenue"
                required
              />
            </div>
            <Input
              label="Suburb"
              {...register('suburb')}
              error={errors.suburb?.message}
              placeholder="e.g. Mosman"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Select label="State" {...register('state')}>
                {AU_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
              <Input
                label="Postcode"
                {...register('postcode')}
                error={errors.postcode?.message}
                placeholder="2088"
                required
              />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div>
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 pb-1 border-b border-teal-100">
            3. Employment & Income
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select label="Employment Basis" {...register('employmentType')}>
              <option value="PAYG Permanent">PAYG Permanent</option>
              <option value="PAYG Casual">PAYG Casual</option>
              <option value="Self Employed">Self Employed (ABN)</option>
              <option value="Contractor">Contractor</option>
              <option value="Retired">Retired / Self-Funded</option>
            </Select>
            <Input
              label="Current Employer"
              {...register('employer')}
              error={errors.employer?.message}
              placeholder="Company or Business name"
              required
            />
            <Input
              label="Occupation"
              {...register('occupation')}
              error={errors.occupation?.message}
              placeholder="e.g. Senior Actuary"
              required
            />
            <Input
              label="Years Employed"
              type="number"
              {...register('yearsEmployed', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Financials */}
        <div>
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3 pb-1 border-b border-teal-100">
            4. Serviceability & Financial Position (AUD)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Base Annual Income ($)"
              type="number"
              {...register('annualIncome', { valueAsNumber: true })}
              error={errors.annualIncome?.message}
            />
            <Input
              label="Other Income / Bonus ($)"
              type="number"
              {...register('otherIncome', { valueAsNumber: true })}
            />
            <Input
              label="Monthly Living Expenses (HEM) ($)"
              type="number"
              {...register('monthlyLivingExpenses', { valueAsNumber: true })}
              error={errors.monthlyLivingExpenses?.message}
            />
            <Input
              label="Total Assets ($)"
              type="number"
              {...register('totalAssets', { valueAsNumber: true })}
            />
            <Input
              label="Total Liabilities ($)"
              type="number"
              {...register('totalLiabilities', { valueAsNumber: true })}
            />
            <Select label="Assigned Broker" {...register('assignedBrokerId')}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.aclNumber})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label="Broker Fact Find & NCCP Assessment Notes"
            {...register('notes')}
            placeholder="Document client objectives, borrowing purpose, Best Interests Duty requirements, and exit strategies..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {clientToEdit ? 'Save Changes' : 'Create Client Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
