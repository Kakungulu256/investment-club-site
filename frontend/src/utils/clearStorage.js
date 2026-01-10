// Clear all browser storage and reset axios
localStorage.clear();
sessionStorage.clear();

// Reset axios defaults
import axios from 'axios';
delete axios.defaults.headers.common['Authorization'];

console.log('Storage cleared and axios reset');