import { type FC, useState } from 'react';
import { Dialog, Button, TextArea, Spinner, Text, Box } from '@radix-ui/themes';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import lolesportleApi from '@/helpers/lolesportleApi';

const SubmitReport: FC = () => {
  const [message, setMessage] = useState<string>('');

  const submitReport = useMutation({
    mutationFn: async (data: { message: string }) => {
      try {
        return await lolesportleApi('report', {
          method: 'POST',
          body: JSON.stringify({ message: data.message }),
        });
      } catch (e) {
        let errorMessage: string|undefined;
        try {
          errorMessage = JSON.parse((e as Error).message || '{}').error;
        } catch (parseError) {
          console.error(parseError);
          throw new Error((e as Error).message);
        }

        throw new Error(errorMessage);
      }
    },
  });

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button
          variant='solid'
          color='tomato'
          style={{
            width: '200px',
            height: '50px',
            cursor: 'pointer',
            position: 'fixed',
            bottom: '75px',
            right: '20px',
            display: submitReport.isSuccess ? 'none' : 'auto'
          }}
          className='hide-mobile'
        >
          Spot an issue?
        </Button>
      </Dialog.Trigger>
      <Dialog.Content style={{ overflowX: 'hidden' }}>
        <Dialog.Close>
          <Box position='absolute' top='4px' right='6px'>
            <Button variant='ghost' style={{ cursor: 'pointer' }}>
              <CrossCircledIcon width={24} height={24} />
            </Button>
          </Box>
        </Dialog.Close>
        <Dialog.Title>Report an issue</Dialog.Title>
        <Dialog.Description mb='2'>
          {submitReport.isSuccess
            ? <>Thank you for helping to improve lolesportle!</>
            : <>Spot a bug or incorrect data? Help improve Lolesportle by letting me know:</>
          }
        </Dialog.Description>
        {!submitReport.isSuccess && (
          <>
            <TextArea
              mb='2'
              placeholder='Brief description of the issue...'
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            {submitReport.isError && (
              <Box mb='2'>
                <Text size='2' color='red'>
                  {(submitReport.error as Error).message}
                </Text>
              </Box>
            )}
            {submitReport.isPending
              ? <Spinner />
              : <Button
                  style={{ cursor: 'pointer' }}
                  onClick={() => submitReport.mutate({ message })}
                >
                  Submit report
                </Button>
            }
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default SubmitReport;
