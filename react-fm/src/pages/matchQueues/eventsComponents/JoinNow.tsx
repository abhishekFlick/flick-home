import { useEffect, useState } from 'react';
import type { FC } from 'react';
import ReactGA from 'react-ga';
import { useNavigate } from 'react-router-dom';

import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import { InputLabel, MenuItem, Select } from '@mui/material';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { Icon } from '@iconify/react';

import { FlexBox } from '@/components/styled';
import useOrientation from '@/hooks/useOrientation';
import useNotifications from '@/store/notifications';

import { apiUrl } from '../constants';
import type { EventDetails } from '../types/Events.types';
import styles from './Events.module.scss';

export const JoinNow: FC<EventDetails> = ({
  stripePaymentUrl,
  reservedPlayersCount,
  reservedPlayersList,
  waitListPlayers,
  waitListPlayersCount,
  venueName,
  uniqueEventId,
}) => {
  const [, notificationsActions] = useNotifications();
  const isPortrait = useOrientation();
  const navigate = useNavigate();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', phoneNumber: '' });
  const [value, setValue] = useState(1);
  const [names, setNames] = useState<Array<string>>(['']);

  const openSpots = reservedPlayersCount - reservedPlayersList.length;
  const openWaitList = waitListPlayersCount - waitListPlayers.length;

  useEffect(() => {
    const googleUserInfo = localStorage.getItem('userData');
    if (googleUserInfo) {
      const data = JSON.parse(googleUserInfo);
      setUserData({ name: data.name, email: data.email, phoneNumber: '' });
    }
  }, []);

  const openInNewTab = (url: string): void => {
    ReactGA.event({
      category: 'Button',
      action: 'Click',
      label: 'Game Joined',
    });
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    history.replaceState(null, '', `#${uniqueEventId}`);
    if (newWindow) newWindow.opener = null;
  };

  function showNotification() {
    notificationsActions.push({
      options: {
        content: (
          <Alert severity="info">
            <AlertTitle className={styles.alertTitle}>Message from {venueName}</AlertTitle>
            Event Full! Please check other events.
          </Alert>
        ),
      },
    });
  }

  // const handleName = (e: { target: { value: string } }) => {
  //   setUserData({ ...userData, name: e.target.value });
  // };

  const handleEmail = (e: { target: { value: string } }) => {
    setUserData({ ...userData, email: e.target.value });
  };

  const handleNumber = (e: { target: { value: string } }) => {
    setUserData({ ...userData, phoneNumber: e.target.value });
  };

  const paymentOptions = (event: { stopPropagation: () => void }) => {
    if (userData.name) {
      event.stopPropagation();
      history.replaceState(null, '', `#${uniqueEventId}`);
      setShowPaymentOptions(true);
    } else {
      navigate('/login');
    }
  };

  const handleClickOpen = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    setOpen(true);
  };

  const userInput = {
    input: {
      uniqueEventId: uniqueEventId,
      playerInputList: [{ waNumber: userData.phoneNumber, name: userData.name }],
    },
  };

  const handlePay = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    history.replaceState(null, '', `#${uniqueEventId}`);

    const { email, phoneNumber }: { email: string; phoneNumber: string } = userData;

    //setting names into array for multiple slots payment.
    const namesArray = names;
    const objectArray = namesArray.map((name) => ({ waNumber: phoneNumber, name: name }));

    const emptyName = namesArray.filter((item) => item == '');

    if (emptyName.length > 0 || email === '' || phoneNumber === '') {
      alert('Please fill all the details');
    } else if (namesArray.length > openSpots) {
      alert(`Names are more than openspots. Only ${openSpots} players are required`);
    } else {
      setOpen(false);

      const generateUrl = () => {
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `mutation InitiatePayment {
                initiatePayment(
                    input: {
                        uniqueEventId: "${uniqueEventId}"
                        playerInputList: [${objectArray
                          .map((obj) => `{ waNumber: "${obj.waNumber}", name: "${obj.name}" }`)
                          .join(',')}] 
                    }
                ) {
                    isInitiated
                    paymentLink
                }
            }`,
            variables: userInput.input,
          }),
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.errors) {
              // Handle GraphQL errors
              throw new Error(result.errors[0].message);
            }
            const paymentUrl = result.data.initiatePayment.paymentLink;
            window.open(paymentUrl, '_self');
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.log(error);
          });
      };

      generateUrl();
    }
  };

  const handleClose = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    setOpen(false);
    setShowPaymentOptions(false);
    setValue(1);
    setNames([]);
  };

  const onModalClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
  };

  return (
    <>
      {openWaitList > 0 ? (
        <>
          {!showPaymentOptions ? (
            <Button variant="contained" onClick={paymentOptions}>
              Join {stripePaymentUrl && openSpots > 0 ? 'Game' : 'Waitlist'}
            </Button>
          ) : null}

          {showPaymentOptions ? (
            <FlexBox className={isPortrait ? styles.paymentOptionsPortrait : styles.paymentOptions}>
              <Button
                variant="contained"
                startIcon={<Icon icon="simple-icons:phonepe" color="navy" />}
                className={styles.payViaUpi}
                onClick={handleClickOpen}
              >
                Pay via UPI
              </Button>
              <Button
                variant="contained"
                startIcon={<CreditCardIcon />}
                className={styles.payViaCard}
                onClick={() => {
                  if (stripePaymentUrl) openInNewTab(stripePaymentUrl);
                  else alert('Match Full');
                }}
              >
                Card
              </Button>
            </FlexBox>
          ) : null}

          <Dialog open={open} onClose={handleClose}>
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <DialogTitle>Become our standout Flickplayer</DialogTitle>
              <DialogTitle className={styles.multipleSlotsText}>
                Book multiple slots by entering names
              </DialogTitle>
              <DialogContent>
                <div className={styles.playersNumber}>
                  <InputLabel id="demo-simple-select-label">Number of Players</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={value}
                    label="Age"
                    variant="standard"
                    onChange={(e) => {
                      e.stopPropagation();
                      setValue(Number(e.target.value));
                      setNames(Array.from({ length: Number(e.target.value) }, () => ''));
                    }}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value, idx) => (
                      <MenuItem key={idx} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
                <div className={styles.playerInputs}>
                  {Array.from({ length: value }, (_, index) => index + 1).map((_, idx) => (
                    <TextField
                      key={idx}
                      required
                      autoFocus
                      margin="dense"
                      name="name"
                      id={`name_${idx}`}
                      label={`Name of Player ${idx + 1}`}
                      value={names[idx]}
                      type="text"
                      autoComplete="none"
                      variant="standard"
                      onChange={(e) => {
                        const newName = [...names];
                        newName[idx] = e.target.value;
                        setNames(newName);
                      }}
                      onClick={onModalClick}
                    />
                  ))}
                </div>
                <TextField
                  required
                  margin="dense"
                  name="email"
                  id="email"
                  label="Email Address"
                  type="email"
                  value={userData.email}
                  autoComplete="none"
                  fullWidth
                  variant="standard"
                  onChange={handleEmail}
                  onClick={onModalClick}
                />
                <TextField
                  required
                  margin="dense"
                  name="number"
                  id="number"
                  label="Phone Number"
                  type="number"
                  autoComplete="none"
                  fullWidth
                  variant="standard"
                  onChange={handleNumber}
                  onClick={onModalClick}
                />
              </DialogContent>
              <DialogActions>
                <Button className={styles.cancel} onClick={handleClose}>
                  Cancel
                </Button>
                <Button className={styles.pay} onClick={handlePay}>
                  Pay
                </Button>
              </DialogActions>
            </div>
          </Dialog>
        </>
      ) : (
        <Tooltip title="Event Locked" arrow>
          <LockIcon onClick={showNotification} className={styles.lock} />
        </Tooltip>
      )}
    </>
  );
};
