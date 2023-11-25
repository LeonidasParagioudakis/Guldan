import axios from 'axios';


(async () => {
    try {
        const response = await axios.get('https://www.docker.com/blog/how-to-use-the-node-docker-official-image/');
        console.log(response);
    } catch (error) {
        console.log(error);
    }
})();