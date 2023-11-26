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

function appendTierCounters (tasks) {
    if (Object.keys(tasks)?.length > 0) {
        for (const [tierKey, tierData] of Object.entries(tasks)) {
            if (tierData.hasOwnProperty('items')) {
                tasks[tierKey].count = Array.isArray(tierData.items) ? tierData.items.length : 0;
                tasks[tierKey].current = 0;
                tasks[tierKey].concurrentTasksCount = 0; 
                tasks[tierKey].notSettledTasksKeys = {};
            }
        }          
    }
}

async function waitAllTierPromises(tierKey, tierData) {
    try {
        if (Object.keys(tierData.notSettledTasksKeys)?.length > 0) {
            while (Object.keys(tierData.notSettledTasksKeys)?.length > 0) {
                console.log(`tier: ${tierKey} | waiting for tasks to finish... Current tasks count: ${tierData.concurrentTasksCount} | not settled: ${Object.keys(tierData.notSettledTasksKeys)?.length}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } catch (error) {
        throw error;
    }
}

(async () => {
	try {
		const tasks = {
            tier1: {
                items: Array.from(Array(1000).keys()).map(row => { return {url: '', id: '134657'}}),
                tasksLimit: 80,
            },
            tier2: {
                items: Array.from(Array(500).keys()).map(row => { return {url: '', id: '134657'}}),
                tasksLimit: 10,
            }
        };
        appendTierCounters(tasks);
        const itemsPreemptionThreshold = 100;
        const timePreemptionThreshold = 600000; // 10 minutes

        if (Object.keys(tasks)?.length > 0) {
            for (const [tierKey, tierData] of Object.entries(tasks)) {
                if (tierData.hasOwnProperty('items') && Array.isArray(tierData.items) && tierData.items.length > 0) {
                    let tierStartTime = new Date();
                    for (let queueId = tierData.current; queueId < tierData.items.length; queueId++) {
                        // throttling
                    	while (Object.keys(tierData.notSettledTasksKeys)?.length >= tierData.tasksLimit) {
                    		console.log(`tier: ${tierKey} | waiting for tasks... Current tasks count: ${tierData.concurrentTasksCount} | not settled: ${Object.keys(tierData.notSettledTasksKeys)?.length}`);
                    		await new Promise(resolve => setTimeout(resolve, 500));
                    	}
                        // preemption
                        const tierCurrentTime = new Date();
                        if ((tierData.current % itemsPreemptionThreshold == 0 && tierData.current > 0) || tierCurrentTime - tierStartTime > timePreemptionThreshold) {
                            console.log(`Preempting tier: ${tierKey} | tier progress: ${tierData.current} | tier current duration: ${tierCurrentTime - tierStartTime}`);
                            await waitAllTierPromises(tierKey, tierData);
                            break;
                        }
                        tierData.current++;
                        const task = tierData.items[queueId];
                        task.queueId = queueId;
                        task.promise = asyncTask(task, tasks[tierKey]);
                    }
                }
            }
        }

		// const tasksLimit = 80;
		// let concurrencyController = {concurrentTasksCount: 0, notSettledTasksKeys: {}};
		// for (let queueId = 0; queueId < tasks.length; queueId++) {
		// 	while (Object.keys(concurrencyController.notSettledTasksKeys)?.length >= tasksLimit) {
		// 		console.log(`waiting for tasks... Current tasks count: ${concurrencyController.concurrentTasksCount} | not settled: ${Object.keys(concurrencyController.notSettledTasksKeys)?.length}`);
		// 		await new Promise(resolve => setTimeout(resolve, 500));
		// 	}
		// 	const task = tasks[queueId];
		// 	task.queueId = queueId;
		// 	task.promise = asyncTask(task, concurrencyController);
		// }
		// const totalPromises = tasks.map(row => row.hasOwnProperty('promise') ? row.promise : Promise.resolve());
		// await Promise.allSettled(totalPromises);
		// console.log(tasks[9].result);
	} catch (error) {
		console.log(`main loop error: ${error}`);
	}
})();
