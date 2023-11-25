import axios from 'axios';

async function asyncTask(task, concurrencyController) {
    try {
		concurrencyController.concurrentTasksCount++;
		concurrencyController.notSettledTasksKeys[task.queueId] = true;
		// task.result = await axios.get('https://www.docker.com/blog/how-to-use-the-node-docker-official-image/');
		await new Promise((resolve,reject) => setTimeout(task.queueId % 2 == 0 ? reject(`rejected in queueId: ${task.queueId}`) : resolve, Math.random() * 2000));
    } catch (error) {
        console.log(error);
		task.result = null;
    } finally {
		concurrencyController.concurrentTasksCount--;
		delete concurrencyController.notSettledTasksKeys[task.queueId];
		console.log(`Queue id ${task.queueId} task completed`);
	}
}

(async () => {
	try {
		const tasks = Array.from(Array(1000).keys()).map(row => { return {url: '', id: '134657'}});
		const tasksLimit = 80;
		let concurrencyController = {concurrentTasksCount: 0, notSettledTasksKeys: {}};
		for (let queueId = 0; queueId < tasks.length; queueId++) {
			while (Object.keys(concurrencyController.notSettledTasksKeys)?.length >= tasksLimit) {
				console.log(`waiting for tasks... Current tasks count: ${concurrencyController.concurrentTasksCount} | not settled: ${Object.keys(concurrencyController.notSettledTasksKeys)?.length}`);
				await new Promise(resolve => setTimeout(resolve, 500));
			}
			const task = tasks[queueId];
			task.queueId = queueId;
			task.promise = asyncTask(task, concurrencyController);
		}
		const totalPromises = tasks.map(row => row.hasOwnProperty('promise') ? row.promise : Promise.resolve());
		await Promise.allSettled(totalPromises);
		// console.log(tasks[9].result);
	} catch (error) {
		console.log(`main loop error: ${error}`);
	}
})();
