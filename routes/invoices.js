const express = require('express')
const ExpressError = require('../expressError')
const database = require('../db')

let router = new express.Router()

router.get('/',async function (err,req,res,next){
    try{
        const result = await database.query(
            `SELECT id, comp_code
            FROM invoices 
            ORDER BY id`
            )
        return res.json({'invoices' : result.rows})
    }
    catch(err){
        return next(err)
    }
})

router.get('/:id', async function(err,req,res,next){
    try{
        let id = req.params.id
        const result = await database.query(
            `SELECT i.id, i.comp_code, i.paid, i.amt, i.paid_date, i.add_date, c.name, c.description
            FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id=$1`, [id]
        )

        if (result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`,404)
        }

        let response = result.rows[0];
        let invoice = {id : response.id, company : {code : response.comp_code, name : response.name, description : response.description}, amt : response.amt, paid : response.paid, paid_date : response.paid_date, add_date : response.add_date};
        return res.json({'invoice': invoice})
    }
    catch(err){
        return next(err)
    }
})

router.post('/', async function(err,req,res,next){
    try{
        let {comp_code, amt} = req.body
        const result = await database.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, add_date, paid_date, paid`,
            [comp_code, amt]
        )
        return res.json({'invoice' : result.rows[0]})
    }
    catch(err){
        return next(err)
    }
})

router.put('/:id', async function(err,req,res,next){
    try{
        let id = req.params.id;
        let {amt, paid} = req.body;
        const result = await database.query(
            `SELECT paid
            FROM invoices
            WHERE id=$1`,
            [id]
        )
        let date = null;
        let currDate = result.rows[0].paid_date

        if(result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`,404)
        }
        else if(!currDate && paid){
            date = new Date()
        }
        else if(!paid){
            date = null
        }
        else{
            date = currDate;
        }
        const response = await database.query(
            `UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, amt, comp_code, paid, add_date, paid_date`,
            [id,amt,paid,date]
        )
        return res.json({'invoice':response.rows[0]})
    }
    catch(err){
        return next(err)
    }
})


router.delete('/:id', async function(err,req,res,next){
    try{
        let id = req.params.id;
        const result = await database.query(
            `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`, [id]
        )
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`,404)
        }
        else{
            return res.json({'status': 'deleted'})
        }
    }
    catch(err){
        return next(err)
    }
})

module.exports = router;