/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  //1) Get checkout session from API
  try {
    const stripe = Stripe(
      'pk_test_51NIu3RCAXx11g5Xp8xFHAvZ6ImANhBHFwM3cIVIA6DagmhfJ1iAZjOX0wTa5bVn2phJrfH0C7rkoZdR5v8gXu7bQ00ZnXDPeAo'
    );
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    //2) create checkout form + charge credit card
    /* await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    }); */
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.error(err);
    showAlert('error', err);
  }
};
